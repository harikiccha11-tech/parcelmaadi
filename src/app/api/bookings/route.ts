import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeForPrice } from "@/lib/fare-compute";
import { getPorterMatchConfig, getSettingsMap, isServiceable, isValidIndianMobile, extractPincode, validateUpload, isNightChargeActive } from "@/lib/config";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { emitRealtime } from "@/lib/realtime";

// POST /api/bookings — create a booking with snapshot fare, dedup, validation, rate limit, realtime push
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const settings = await getSettingsMap();
    // Rate limit
    const limit = Number(settings.rate_limit_booking_per_minute || 3);
    const rl = rateLimit(`booking:${ip}`, Number.isFinite(limit) ? limit : 3);
    if (!rl.ok) {
      return NextResponse.json({ error: `Too many booking attempts. Please retry in ${rl.retryAfterSec}s.` }, { status: 429 });
    }

    const body = await req.json();
    const {
      customer: { name, mobile, email } = {},
      serviceId, vehicleId, priceId,
      pickupAddress, pickupLat, pickupLng, pickupMapLink,
      dropAddress, dropLat, dropLng, dropMapLink,
      distanceKm, distanceMethod,
      scheduleDate, scheduleTime,
      itemDetails, weight, quantity, customerNotes, landmark,
      isNight, isExpress, needsHelper, waitingMinutes, tollParking,
      paymentOption, etaText,
      // per-service-type extras
      tripType, durationHours, durationDays,
      unitType, unitQuantity, supplierId, materialCost, deliveryCharge,
      // file info (uploaded separately, here we just store references)
      fileName, fileType, photoDataUrl,
    } = body || {};

    // ---- Validation ----
    if (!name || !mobile) return NextResponse.json({ error: "Name and mobile required" }, { status: 400 });
    if (!isValidIndianMobile(mobile)) return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile (starts 6-9)" }, { status: 400 });
    if (!serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 });
    const svc = await db.service.findUnique({ where: { id: Number(serviceId) } });
    if (!svc) return NextResponse.json({ error: "Service not found" }, { status: 400 });
    const isEmergency = svc.slug === "emergency-booking";
    const isMaterialOrShop = svc.slug === "material-supply" || svc.slug === "supplier-shop";
    const isMachinery = svc.slug === "machinery-rental";
    const isWater = svc.slug === "water-supply";
    const needsPickupDrop = !isMaterialOrShop && !isMachinery && !isWater;
    // For pickup+drop services, require pickup/drop coords or map link
    if (needsPickupDrop) {
      if (!pickupAddress || !dropAddress) return NextResponse.json({ error: "Pickup and drop address required" }, { status: 400 });
      const hasPickupCoords = (pickupLat != null && pickupLng != null) || pickupMapLink;
      const hasDropCoords = (dropLat != null && dropLng != null) || dropMapLink;
      if (!hasPickupCoords || !hasDropCoords) return NextResponse.json({ error: "Pickup/drop location (lat/lng or map link) required" }, { status: 400 });
    }
    // For single-location services (material/machinery/water), require drop location (delivery/site)
    if (!needsPickupDrop) {
      if (!dropAddress) return NextResponse.json({ error: "Delivery/site address required" }, { status: 400 });
      const hasDropCoords = (dropLat != null && dropLng != null) || dropMapLink;
      if (!hasDropCoords) return NextResponse.json({ error: "Location (lat/lng or map link) required" }, { status: 400 });
    }

    // ---- Serviceable-area check (Karnataka-first) ----
    {
      const addr = needsPickupDrop ? `${pickupAddress || ""} ${dropAddress || ""}` : (dropAddress || "");
      const pin = extractPincode(`${addr} ${dropMapLink || ""} ${pickupMapLink || ""}`);
      const areaCheck = await isServiceable(addr, pin || undefined);
      if (!areaCheck.ok) {
        return NextResponse.json({ error: areaCheck.reason || "Area not serviceable" }, { status: 400 });
      }
    }

    // ---- Duplicate booking prevention (same mobile + service + pickup/drop within 2 min) ----
    const cleanMobile = String(mobile).replace(/\D/g, "").slice(-10);
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
    const dup = await db.booking.findFirst({
      where: {
        customer: { mobile: cleanMobile },
        serviceId: Number(serviceId),
        pickupAddress: pickupAddress || undefined,
        dropAddress: dropAddress || undefined,
        createdAt: { gte: twoMinAgo },
        status: { not: "Cancelled" },
      },
    });
    if (dup) {
      return NextResponse.json({ error: "A similar booking was just placed. Please wait 2 minutes or use your Order ID to track.", duplicate: true, existingBookingId: dup.bookingId }, { status: 409 });
    }

    // ---- Find or create customer ----
    let customer = await db.customer.findFirst({ where: { mobile: cleanMobile } });
    if (!customer) {
      customer = await db.customer.create({ data: { name, mobile: cleanMobile, email: email || null } });
    } else {
      await db.customer.update({ where: { id: customer.id }, data: { name, email: email || customer.email } });
    }

    // ---- Fetch price master (snapshot source) ----
    const price = priceId
      ? await db.priceMaster.findUnique({ where: { id: Number(priceId) }, include: { service: true, vehicle: true, supplier: true } })
      : await db.priceMaster.findFirst({ where: { serviceId: Number(serviceId), vehicleId: vehicleId ? Number(vehicleId) : null, status: "Active" }, include: { service: true, vehicle: true, supplier: true } });
    if (!price) return NextResponse.json({ error: "No active price for this service/vehicle" }, { status: 400 });

    const distance = Number(distanceKm) || 0;
    const porterConfig = await getPorterMatchConfig(price.commissionPercent || 0);
    const nightAuto = await isNightChargeActive();
    const breakup = computeForPrice(price, {
      distance,
      nightActive: isNight || nightAuto,
      isExpress, needsHelper, waitingMinutes, tollParking,
      tripType, durationHours: Number(durationHours) || 0, durationDays: Number(durationDays) || 0,
      porterConfig,
      materialCost: materialCost != null ? Number(materialCost) : undefined,
      deliveryCharge: deliveryCharge != null ? Number(deliveryCharge) : undefined,
    });

    // ---- Validate payment option against admin toggles ----
    const allowedPayments: string[] = [];
    if (settings.payment_pay_advance !== "false") allowedPayments.push("Pay Advance");
    if (settings.payment_pay_full !== "false") allowedPayments.push("Pay Full Amount");
    if (settings.payment_pay_later !== "false") allowedPayments.push("Pay Later");
    const finalPayment = paymentOption && allowedPayments.includes(paymentOption) ? paymentOption : (allowedPayments[0] || "Pay Later");

    // ---- Generate Order ID ----
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const bookingId = `PM-${ymd}-${rand}`;

    // ---- Validate upload file references ----
    let photoUrl: string | null = null;
    let storedFileName: string | null = null;
    let storedFileType: string | null = null;
    if (photoDataUrl && fileName) {
      // Detect type from data URL prefix
      const mimeMatch = photoDataUrl.match(/^data:([^;]+);/);
      const mime = mimeMatch ? mimeMatch[1] : fileType || "";
      const sizeBytes = Math.ceil((photoDataUrl.split(",")[1] || "").length * 0.75);
      const maxMb = Number(settings.upload_max_size_mb || 5);
      const check = validateUpload({ name: fileName, type: mime, size: sizeBytes }, maxMb);
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
      photoUrl = photoDataUrl;
      storedFileName = fileName;
      storedFileType = mime;
    }

    const booking = await db.booking.create({
      data: {
        bookingId,
        customerId: customer.id,
        serviceId: Number(serviceId),
        vehicleId: vehicleId ? Number(vehicleId) : price.vehicleId,
        supplierId: supplierId ? Number(supplierId) : (price.supplierId || null),
        pickupAddress: pickupAddress ?? null, pickupLat: pickupLat ? Number(pickupLat) : null, pickupLng: pickupLng ? Number(pickupLng) : null, pickupMapLink: pickupMapLink ?? null,
        dropAddress: dropAddress ?? null, dropLat: dropLat ? Number(dropLat) : null, dropLng: dropLng ? Number(dropLng) : null, dropMapLink: dropMapLink ?? null,
        distanceKm: distance,
        distanceMethod: distanceMethod || "manual",
        scheduleDate: scheduleDate || null, scheduleTime: scheduleTime || null,
        itemDetails: itemDetails || null, weight: weight || null, quantity: quantity || null,
        tripType: tripType || null,
        durationHours: durationHours ? Number(durationHours) : null,
        durationDays: durationDays ? Number(durationDays) : null,
        unitType: unitType || price.unitType || null,
        unitQuantity: unitQuantity ? Number(unitQuantity) : null,
        materialCost: materialCost != null ? Number(materialCost) : null,
        deliveryCharge: deliveryCharge != null ? Number(deliveryCharge) : null,
        rushSurchargeApplied: (price as any).rushSurchargePercent || 0,
        isEmergency,
        photoUrl: photoUrl ?? null, fileName: storedFileName ?? null, fileType: storedFileType ?? null,
        landmark: landmark || null,
        etaText: etaText || null,
        fareSnapshotJson: JSON.stringify({ breakup, priceSnapshot: { minimumFare: price.minimumFare, perKmRate: price.perKmRate, slabJson: price.slabJson, loadingCharge: price.loadingCharge, gstPercent: price.gstPercent, advancePercent: price.advancePercent, commissionPercent: price.commissionPercent, pricingType: (price as any).pricingType, perUnitRate: (price as any).perUnitRate, roundTripMultiplier: (price as any).roundTripMultiplier, rushSurchargePercent: (price as any).rushSurchargePercent }, priceId: price.id, distanceKm: distance, porterMatch: porterConfig, tripType, durationHours, durationDays, materialCost, deliveryCharge }),
        finalEstimate: breakup.manualQuote ? 0 : breakup.finalEstimate,
        discountApplied: breakup.discountAmount,
        paymentOption: finalPayment,
        paymentStatus: "Pending",
        status: "New",
        customerNotes: customerNotes || null,
        createdByIp: ip,
      },
      include: { service: true, vehicle: true, customer: true, supplier: true },
    });

    await db.statusHistory.create({
      data: { bookingId: booking.id, oldStatus: null, newStatus: "New", changedBy: "customer", notes: "Booking created" },
    });

    // ---- Real-time push to all admin panels ----
    await emitRealtime("booking:new", {
      bookingId: booking.bookingId,
      id: booking.id,
      customerName: booking.customer?.name,
      customerMobile: booking.customer?.mobile,
      serviceName: booking.service?.name,
      vehicleName: booking.vehicle?.name,
      finalEstimate: booking.finalEstimate,
      status: booking.status,
      isEmergency: booking.isEmergency,
      createdAt: booking.createdAt,
    });

    // ---- Free notifications to admin (ntfy + Telegram + browser push via realtime) ----
    const ntfyTopic = settings.ntfy_topic || "parcelmaadi-admin";
    const ntfyServer = settings.ntfy_server || "https://ntfy.sh";
    const notifTitle = booking.isEmergency
      ? `🚨 EMERGENCY BOOKING ${booking.bookingId}`
      : `📦 New Booking ${booking.bookingId}`;
    const notifBody = `${booking.customer?.name} (${booking.customer?.mobile})\n${booking.service?.name} · ${booking.vehicle?.name || ""}\n₹${booking.finalEstimate || "Manual quote"}\n${booking.pickupAddress?.slice(0, 50) || ""} → ${booking.dropAddress?.slice(0, 50) || ""}`;

    // 1. ntfy push (free)
    try {
      if (settings.tool_ntfy !== "false") {
        await fetch(`${ntfyServer}/${ntfyTopic}`, {
          method: "POST",
          headers: {
            "Title": notifTitle,
            "Tags": booking.isEmergency ? "rotating_light,package" : "package,white_check_mark",
            "Priority": booking.isEmergency ? "urgent" : "default",
            "Click": `https://${settings.website || "parcelmaadi.com"}`,
          },
          body: notifBody,
          signal: AbortSignal.timeout(3000),
        });
      }
    } catch {}

    // 2. Telegram bot (free) — send to admin chat ID
    try {
      if (settings.tool_telegram === "true" && settings.telegram_bot_token && settings.telegram_chat_id) {
        const tgUrl = `https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`;
        await fetch(tgUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: settings.telegram_chat_id,
            text: `${notifTitle}\n\n${notifBody}`,
            parse_mode: "HTML",
          }),
          signal: AbortSignal.timeout(5000),
        });
      }
    } catch {}

    // 3. Emergency extra alert
    if (booking.isEmergency) {
      await emitRealtime("emergency:new", {
        bookingId: booking.bookingId,
        customerName: booking.customer?.name,
        customerMobile: booking.customer?.mobile,
        serviceName: booking.service?.name,
        finalEstimate: booking.finalEstimate,
      });
    }

    return NextResponse.json({ booking, fare: breakup });
  } catch (e: any) {
    console.error("booking create error", e);
    return NextResponse.json({ error: e?.message || "Booking failed" }, { status: 500 });
  }
}

// GET /api/bookings?mobile=... — list bookings for a customer by mobile
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mobile = url.searchParams.get("mobile");
    const bookingId = url.searchParams.get("bookingId");
    if (bookingId) {
      const booking = await db.booking.findFirst({
        where: { bookingId },
        include: { service: true, vehicle: true, customer: true, statusHistory: { orderBy: { createdAt: "asc" } } },
      });
      if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ booking });
    }
    if (!mobile) return NextResponse.json({ error: "mobile or bookingId required" }, { status: 400 });
    const cleanMobile = String(mobile).replace(/\D/g, "").slice(-10);
    const customer = await db.customer.findFirst({ where: { mobile: cleanMobile } });
    if (!customer) return NextResponse.json({ bookings: [] });
    const bookings = await db.booking.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { service: true, vehicle: true },
    });
    return NextResponse.json({ bookings, customer });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
