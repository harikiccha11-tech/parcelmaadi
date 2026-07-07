"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { api, type PublicData, type Service, type Vehicle, type PriceMaster, type FareBreakup, type Booking, type Product, ORDER_STATUS_OPTIONS } from "@/lib/api";
import { ServiceIcon } from "@/components/service-icon";
import { MapPicker, type MapPickerValue } from "@/components/map-picker";
import { MotionBackground } from "@/components/motion-background";
import { ServiceVideoBackground } from "@/components/service-video-background";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "@/components/cart-drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Navigation, Phone, MessageCircle, Package, Loader2,
  CheckCircle2, ChevronRight, ChevronLeft, Truck, Crosshair, Copy, Search,
  ShieldCheck, Star, Zap, ArrowRight, Home as HomeIcon, PackageSearch,
  Upload, Clock, AlertCircle, FileText, X, Droplets, ShoppingBag, Plus,
  IndianRupee, Download, ShoppingCart, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription,
} from "@/components/ui/sheet";

interface CustomerAppProps {
  onOpenAdmin: () => void;
}

type Step = "home" | "location" | "triptype" | "vehicles" | "shop-list" | "material-quantity" | "material-location" | "material-shops" | "machinery-duration" | "machinery-location" | "water-type" | "water-cans-qty" | "water-location" | "borewell-depth" | "borewell-location" | "details" | "payment" | "success" | "orders" | "policies";

interface FareCard { price: PriceMaster; breakup: FareBreakup; }
interface MaterialShopCard { priceId: number; shop: any; material: any; quantity: number; materialCost: number; deliveryCharge: number; distanceKm: number | null; gst: number; finalLandedPrice: number; advancePercent: number; advanceAmount: number; }

export function CustomerApp({ onOpenAdmin }: CustomerAppProps) {
  const [publicData, setPublicData] = useState<PublicData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [step, setStep] = useState<Step>("home");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);

  // CRITICAL: scroll to TOP whenever customer step changes — prevents showing from bottom
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }
  }, [step, selectedService]);

  // location
  const [pickup, setPickup] = useState<MapPickerValue>({ address: "", lat: null, lng: null, mapLink: "" });
  const [drop, setDrop] = useState<MapPickerValue>({ address: "", lat: null, lng: null, mapLink: "" });
  const [pickerOpen, setPickerOpen] = useState<null | "pickup" | "drop">(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [distanceMethod, setDistanceMethod] = useState<string>("");
  const [etaText, setEtaText] = useState<string>("");
  const [manualKm, setManualKm] = useState("");

  // fare cards
  const [fareCards, setFareCards] = useState<FareCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<FareCard | null>(null);
  const [loadingCards, setLoadingCards] = useState(false);

  // options
  const [isNight, setIsNight] = useState(false);
  const [isExpress, setIsExpress] = useState(false);
  const [needsHelper, setNeedsHelper] = useState(false);

  // customer form
  const [customer, setCustomer] = useState({ name: "", mobile: "", email: "" });
  const [schedule, setSchedule] = useState({ date: "", time: "" });
  const [itemDetails, setItemDetails] = useState("");
  const [weight, setWeight] = useState("");
  const [quantity, setQuantity] = useState("");
  const [landmark, setLandmark] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [paymentOption, setPaymentOption] = useState("Pay Later");
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  // per-service-type flow state
  const [tripType, setTripType] = useState<"One-Way" | "Round-Trip">("One-Way");
  const [durationHours, setDurationHours] = useState<number>(2);
  const [durationDays, setDurationDays] = useState<number>(1);
  const [materialVehicle, setMaterialVehicle] = useState<Vehicle | null>(null);
  const [materialQuantity, setMaterialQuantity] = useState<number>(1);
  const [materialShopCards, setMaterialShopCards] = useState<MaterialShopCard[]>([]);
  const [selectedShopCard, setSelectedShopCard] = useState<MaterialShopCard | null>(null);
  const [machineryCards, setMachineryCards] = useState<FareCard[]>([]);
  const [waterCards, setWaterCards] = useState<FareCard[]>([]);
  const [waterType, setWaterType] = useState<Vehicle | null>(null);
  const [borewellDepth, setBorewellDepth] = useState<number>(100);
  const [borewellCards, setBorewellCards] = useState<FareCard[]>([]);

  // orders
  const [ordersMobile, setOrdersMobile] = useState("");
  const [orders, setOrders] = useState<Booking[]>([]);
  // Zone filter — user enters their pincode to see only what's available in their area
  const [userPincode, setUserPincode] = useState<string>("");
  // Load saved pincode from localStorage on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("pm_pincode") || "" : "";
    if (saved) setUserPincode(saved);
  }, []);

  useEffect(() => {
    api.getPublic().then((d) => setPublicData(d)).catch(() => {});
    api.getServices(userPincode).then((d) => setServices(d.services)).catch(() => {});
    // Auto-refresh every 30 seconds so admin changes appear without manual page reload
    const interval = setInterval(() => {
      api.getPublic().then((d) => setPublicData(d)).catch(() => {});
      api.getServices(userPincode).then((d) => setServices(d.services)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [userPincode]);

  const settings = publicData?.settings || {};
  const content = publicData?.content || {};
  const hero = content.hero || {};
  const howItWorks = content.how_it_works || {};
  const about = content.about || {};
  const trust = content.trust || {};

  const allowedPayments: string[] = [];
  if (settings.payment_pay_advance !== "false") allowedPayments.push("Pay Advance");
  if (settings.payment_pay_full !== "false") allowedPayments.push("Pay Full Amount");
  if (settings.payment_pay_later !== "false") allowedPayments.push("Pay Later");

  const selectService = useCallback(async (svc: Service) => {
    setSelectedService(svc);
    setPickup({ address: "", lat: null, lng: null, mapLink: "" });
    setDrop({ address: "", lat: null, lng: null, mapLink: "" });
    setDistanceKm(null); setManualKm(""); setEtaText("");
    setFareCards([]); setSelectedCard(null);
    setMaterialShopCards([]); setSelectedShopCard(null);
    setMachineryCards([]); setWaterCards([]);
    setMaterialVehicle(null);
    setWaterType(null);
    setBorewellCards([]); setBorewellDepth(100);
    setBooking(null);
    setSelectedShopId(null);
    // Route to correct first step per service type
    if (svc.slug === "emergency-booking" || svc.slug === "outstation-booking" || svc.slug === "parcel-delivery" || svc.slug === "goods-transport") {
      // pickup+drop → vehicle cards
      setStep("location");
    } else if (svc.slug === "material-supply") {
      // material: select material type → quantity → delivery location → shops by landed price
      setStep("vehicles");
    } else if (svc.slug === "supplier-shop" || svc.slug === "food-delivery") {
      // Supplier/Shop + Food Delivery: shop/restaurant directory → select → that shop's products
      setStep("shop-list");
    } else if (svc.slug === "grocery-ration") {
      // grocery: direct product catalog
      setStep("vehicles");
    } else if (svc.slug === "machinery-rental") {
      // machinery: select machine → duration → site location → price cards
      setStep("vehicles");
    } else if (svc.slug === "water-supply") {
      // water: select water TYPE → tanker SIZE → delivery location → price cards
      setStep("water-type");
    } else if (svc.slug === "borewell-drilling") {
      // borewell: select rig → enter depth (feet) → site location → live price
      setStep("vehicles");
    } else {
      setStep("location");
    }
  }, []);

  const calculateDistance = useCallback(async () => {
    if (manualKm && Number(manualKm) > 0) {
      setDistanceKm(Number(manualKm));
      setDistanceMethod("manual");
      setEtaText(`${Math.round((Number(manualKm) / 25) * 60)} min (est)`);
      return;
    }
    if (pickup.lat != null && pickup.lng != null && drop.lat != null && drop.lng != null) {
      try {
        const d = await api.distance({ pickupLat: pickup.lat, pickupLng: pickup.lng, dropLat: drop.lat, dropLng: drop.lng });
        setDistanceKm(d.distanceKm);
        setDistanceMethod(d.method);
        if (d.durationText) setEtaText(d.durationText);
        else setEtaText(`${Math.round((d.distanceKm / 25) * 60)} min (est)`);
        if (d.method !== "google") toast.info(d.note || "Estimated distance — you can override with manual KM.");
      } catch (e: any) {
        toast.error(e.message || "Distance calc failed — enter manual KM");
      }
    } else {
      toast.info("Please select both pickup & drop on the map first");
    }
  }, [pickup, drop, manualKm]);

  // AUTO-CALCULATE distance when both pickup & drop are set (no manual button needed)
  useEffect(() => {
    if (pickup.lat != null && pickup.lng != null && drop.lat != null && drop.lng != null && !manualKm) {
      (async () => {
        try {
          const d = await api.distance({ pickupLat: pickup.lat, pickupLng: pickup.lng, dropLat: drop.lat, dropLng: drop.lng });
          setDistanceKm(d.distanceKm);
          setDistanceMethod(d.method);
          if (d.durationText) setEtaText(d.durationText);
          else setEtaText(`${Math.round((d.distanceKm / 25) * 60)} min (est)`);
        } catch (e: any) {
          // Silent fail — user can use manual KM fallback
        }
      })();
    }
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng]);

  const loadVehicleCards = useCallback(async () => {
    if (!selectedService) return;
    if (distanceKm == null) {
      toast.error("Calculate distance first");
      return;
    }
    setLoadingCards(true);
    try {
      const opts: any = { isNight, isExpress, needsHelper };
      if (selectedService.slug === "outstation-booking") opts.tripType = tripType;
      if (selectedService.slug === "machinery-rental") { opts.durationHours = durationHours; opts.durationDays = durationDays; }
      const r = await api.fareCards(selectedService.id, distanceKm, opts);
      setFareCards(r.cards || []);
      setStep("vehicles");
    } catch (e: any) {
      toast.error(e.message || "Failed to load vehicle prices");
    } finally {
      setLoadingCards(false);
    }
  }, [selectedService, distanceKm, isNight, isExpress, needsHelper, tripType, durationHours, durationDays]);

  // ---- Load material shops sorted by landed price ----
  const loadMaterialShops = useCallback(async () => {
    if (!materialVehicle) { toast.error("Select a material first"); return; }
    if (!drop.lat || !drop.lng) { toast.error("Select delivery location first"); return; }
    setLoadingCards(true);
    try {
      const r = await api.materialShops(materialVehicle.slug!, materialQuantity, drop.lat, drop.lng);
      setMaterialShopCards(r.cards || []);
      setStep("material-shops");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingCards(false); }
  }, [materialVehicle, drop, materialQuantity]);

  // ---- Load shop cards (after product + quantity + location) — standard fare, not material-shops ----
  const loadShopCards = useCallback(async () => {
    if (!selectedService) return;
    if (!drop.lat || !drop.lng) { toast.error("Select delivery location first"); return; }
    setLoadingCards(true);
    try {
      const r = await api.fareCards(selectedService.id, 0, { isNight, isExpress });
      const allCards = r.cards || [];
      // Filter to only the selected product
      const filtered = materialVehicle ? allCards.filter((c: FareCard) => c.price.vehicleId === materialVehicle.id) : allCards;
      setWaterCards(filtered.length > 0 ? filtered : allCards); // reuse waterCards state for shop cards
      setStep("vehicles");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingCards(false); }
  }, [selectedService, drop, isNight, isExpress, materialVehicle]);

  // ---- Load machinery cards (after machine + duration + location) ----
  const loadMachineryCards = useCallback(async () => {
    if (!selectedService) return;
    if (!drop.lat || !drop.lng) { toast.error("Select site location first"); return; }
    setLoadingCards(true);
    try {
      // distance for site delivery = 0 (computed inside fare via perKm × distance if needed).
      // For machinery, the "distance" is the site-delivery distance from a depot; we pass 0 and let transport be 0 if not measurable.
      const r = await api.fareCards(selectedService.id, 0, { durationHours, durationDays });
      setMachineryCards(r.cards || []);
      setStep("vehicles");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingCards(false); }
  }, [selectedService, drop, durationHours, durationDays]);

  // ---- Load water cards (after water type + location) ----
  const loadWaterCards = useCallback(async () => {
    if (!selectedService) return;
    if (!drop.lat || !drop.lng) { toast.error("Select delivery location first"); return; }
    setLoadingCards(true);
    try {
      const r = await api.fareCards(selectedService.id, 0, { isNight, isExpress });
      // Filter to only the selected tanker size
      const allCards = r.cards || [];
      const filtered = materialVehicle ? allCards.filter((c: FareCard) => c.price.vehicleId === materialVehicle.id) : allCards;
      setWaterCards(filtered.length > 0 ? filtered : allCards);
      setStep("vehicles");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingCards(false); }
  }, [selectedService, drop, isNight, isExpress, materialVehicle]);

  // ---- Load borewell cards (after rig + depth + location) — per-foot pricing ----
  const loadBorewellCards = useCallback(async () => {
    if (!selectedService) return;
    if (!drop.lat || !drop.lng) { toast.error("Select site location first"); return; }
    setLoadingCards(true);
    try {
      // Pass distanceKm=0 (transport handled by perKm), and depth as a custom field
      // The fare engine will use the slab text "0-100 ft: 98 per ft, 101+ ft: 110 per ft" to compute
      const r = await api.fareCards(selectedService.id, 0, {});
      const allCards = r.cards || [];
      // Filter to only the selected rig
      const filtered = materialVehicle ? allCards.filter((c: FareCard) => c.price.vehicleId === materialVehicle.id) : allCards;
      // Manually compute per-foot price since the fare engine uses KM slabs not ft slabs
      const computed = (filtered.length > 0 ? filtered : allCards).map((c: FareCard) => {
        const p = c.price;
        const depth = borewellDepth || 100;
        // Parse per-foot slabs from slabJson: "0-100 ft: 98 per ft, 101+ ft: 110 per ft"
        const slabMatch = (p.slabJson || "").match(/0-100\s*ft:\s*(\d+)\s*per\s*ft.*?101\+\s*ft:\s*(\d+)\s*per\s*ft/i);
        let perFtRate1 = 98, perFtRate2 = 110;
        if (slabMatch) { perFtRate1 = Number(slabMatch[1]); perFtRate2 = Number(slabMatch[2]); }
        const first100FtCost = Math.min(depth, 100) * perFtRate1;
        const after100FtCost = Math.max(0, depth - 100) * perFtRate2;
        const drillingCost = first100FtCost + after100FtCost;
        const baseFare = p.minimumFare || 0;
        const transport = 0; // transport added at booking time based on actual KM
        const subtotal = baseFare + drillingCost + transport;
        const gst = Math.round((subtotal * (p.gstPercent || 0)) / 100);
        const finalEstimate = subtotal + gst;
        const advanceAmount = p.advancePercent > 0 ? Math.round((finalEstimate * p.advancePercent) / 100) : 0;
        const customBreakup = {
          ...c.breakup,
          baseFare,
          distanceCharge: drillingCost,
          finalEstimate,
          advanceAmount,
          calculationNotes: [
            `Base mobilization: ₹${baseFare}`,
            `Drilling ${depth} ft: ${Math.min(depth, 100)} ft × ₹${perFtRate1}/ft${depth > 100 ? ` + ${depth - 100} ft × ₹${perFtRate2}/ft` : ""} = ₹${drillingCost}`,
            gst > 0 ? `GST: ${p.gstPercent}%` : "",
            advanceAmount > 0 ? `Advance (${p.advancePercent}%): ₹${advanceAmount}` : "",
          ].filter(Boolean),
        };
        return { ...c, breakup: customBreakup };
      });
      setBorewellCards(computed);
      setStep("vehicles");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingCards(false); }
  }, [selectedService, drop, materialVehicle, borewellDepth]);

  const fileToDataUrl = (file: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const submitBooking = useCallback(async () => {
    if (!selectedService) return;
    if (!customer.name.trim()) { toast.error("Name required"); return; }
    const cleanMobile = customer.mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) { toast.error("Enter a valid 10-digit Indian mobile (starts 6-9)"); return; }
    if (submitting) return; // dedup on client
    setSubmitting(true);
    try {
      let photoDataUrl: string | undefined;
      let fileName: string | undefined;
      let fileType: string | undefined;
      if (paymentFile) {
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowed.includes(paymentFile.type)) { toast.error("Only JPG/PNG/WEBP/PDF allowed"); setSubmitting(false); return; }
        if (paymentFile.size > 5 * 1024 * 1024) { toast.error("File too large. Max 5MB"); setSubmitting(false); return; }
        photoDataUrl = await fileToDataUrl(paymentFile);
        fileName = paymentFile.name;
        fileType = paymentFile.type;
      }
      const r = await api.createBooking({
        customer,
        serviceId: selectedService.id,
        vehicleId: selectedCard?.price.vehicleId || materialVehicle?.id || selectedShopCard?.priceId || null,
        priceId: selectedCard?.price.id || selectedShopCard?.priceId || null,
        supplierId: selectedShopCard?.shop?.id || null,
        pickupAddress: pickup.address, pickupLat: pickup.lat, pickupLng: pickup.lng, pickupMapLink: pickup.mapLink,
        dropAddress: drop.address, dropLat: drop.lat, dropLng: drop.lng, dropMapLink: drop.mapLink,
        distanceKm: distanceKm || 0, distanceMethod,
        scheduleDate: schedule.date, scheduleTime: schedule.time,
        itemDetails, weight, quantity, customerNotes, landmark, etaText,
        isNight, isExpress, needsHelper,
        // per-service-type extras
        tripType: selectedService.slug === "outstation-booking" ? tripType : undefined,
        durationHours: selectedService.slug === "machinery-rental" ? durationHours : undefined,
        durationDays: selectedService.slug === "machinery-rental" ? durationDays : undefined,
        unitType: selectedShopCard ? selectedShopCard.material.unitType : (selectedCard?.price.unitType || undefined),
        unitQuantity: selectedShopCard ? selectedShopCard.quantity : (materialVehicle ? materialQuantity : undefined),
        materialCost: selectedShopCard?.materialCost,
        deliveryCharge: selectedShopCard?.deliveryCharge,
        paymentOption,
        photoDataUrl, fileName, fileType,
      });
      setBooking(r.booking);
      setStep("success");
      toast.success("Booking created! Order ID: " + r.booking.bookingId);
    } catch (e: any) {
      toast.error(e.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }, [selectedService, selectedCard, selectedShopCard, materialVehicle, materialQuantity, customer, pickup, drop, distanceKm, distanceMethod, schedule, itemDetails, weight, quantity, customerNotes, landmark, etaText, isNight, isExpress, needsHelper, tripType, durationHours, durationDays, paymentOption, paymentFile, submitting]);

  const loadOrders = useCallback(async () => {
    const clean = ordersMobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(clean)) { toast.error("Enter valid 10-digit mobile"); return; }
    try {
      const r = await api.getMyBookings(clean);
      setOrders(r.bookings || []);
      if ((r.bookings || []).length === 0) toast.info("No bookings found for this mobile");
    } catch (e: any) { toast.error(e.message); }
  }, [ordersMobile]);

  const cancelOrder = useCallback(async (bookingId: string) => {
    if (!confirm("Cancel this booking? This cannot be undone.")) return;
    try {
      await api.cancelBooking(bookingId);
      toast.success("Booking cancelled");
      setOrders((prev) => prev.map((b) => b.bookingId === bookingId ? { ...b, status: "Cancelled" } : b));
    } catch (e: any) { toast.error(e.message); }
  }, []);

  const whatsappNumber = settings.whatsapp_number || "919741433725";
  const waLink = (text: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

  const restart = () => {
    setStep("home");
    setSelectedService(null); setSelectedCard(null); setBooking(null);
    setPickup({ address: "", lat: null, lng: null, mapLink: "" });
    setDrop({ address: "", lat: null, lng: null, mapLink: "" });
    setDistanceKm(null); setManualKm(""); setFareCards([]);
    setCustomer({ name: "", mobile: "", email: "" });
    setItemDetails(""); setWeight(""); setQuantity(""); setCustomerNotes(""); setLandmark("");
    setPaymentFile(null);
  };

  // Direct borewell booking from homepage — jumps straight to rig selection
  const onSelectBorewellFromHome = useCallback(async (borewellVehicle: Vehicle) => {
    const borewellSvc = services.find((s) => s.slug === "borewell-drilling");
    if (!borewellSvc) { toast.error("Borewell service not found"); return; }
    selectService(borewellSvc);
  }, [services, selectService]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CustomerHeader settings={settings} onOpenAdmin={onOpenAdmin} onHome={() => restart()} onOrders={() => setStep("orders")} onPolicies={() => setStep("policies")} />
      <main className="flex-1">
        {step === "home" && (
          <HomeView settings={settings} hero={hero} howItWorks={howItWorks} about={about} trust={trust}
            services={services} onSelectService={selectService} onOrders={() => setStep("orders")} onPolicies={() => setStep("policies")}
            userPincode={userPincode} setUserPincode={setUserPincode} />
        )}
        {step === "location" && selectedService && (selectedService.slug === "parcel-delivery" || selectedService.slug === "goods-transport" || selectedService.slug === "emergency-booking" || selectedService.slug === "outstation-booking") && (
          <LocationView service={selectedService}
            pickup={pickup} drop={drop}
            onOpenPicker={(which) => setPickerOpen(which)}
            manualKm={manualKm} setManualKm={setManualKm}
            distanceKm={distanceKm} distanceMethod={distanceMethod} etaText={etaText}
            calculateDistance={calculateDistance}
            loadingCards={loadingCards}
            singleLocation={false}
            onBack={() => setStep("home")}
            onNext={selectedService.slug === "outstation-booking" ? () => setStep("triptype") : loadVehicleCards}
          />
        )}
        {step === "triptype" && selectedService && (
          <TripTypeView service={selectedService} tripType={tripType} setTripType={setTripType}
            schedule={schedule} setSchedule={setSchedule}
            distanceKm={distanceKm} etaText={etaText}
            onBack={() => setStep("location")} onNext={loadVehicleCards} />
        )}
        {step === "vehicles" && selectedService && (selectedService.slug === "parcel-delivery" || selectedService.slug === "goods-transport" || selectedService.slug === "emergency-booking" || selectedService.slug === "outstation-booking") && (
          <VehiclesView service={selectedService} cards={fareCards} distanceKm={distanceKm || 0} etaText={etaText}
            selected={selectedCard} onSelect={(c) => { setSelectedCard(c); setStep("details"); }}
            onBack={() => selectedService.slug === "outstation-booking" ? setStep("triptype") : setStep("location")} />
        )}
        {/* Material Supply: item-type selection → quantity → single location → shops */}
        {step === "vehicles" && selectedService?.slug === "material-supply" && (
          <ItemTypeSelectView service={selectedService} title="Select Material" onBack={() => setStep("home")}
            onSelect={async (v) => { setMaterialVehicle(v); setStep("material-quantity"); }} />
        )}
        {/* Supplier/Shop: shop directory — select a shop type first */}
        {step === "shop-list" && (selectedService?.slug === "supplier-shop" || selectedService?.slug === "food-delivery") && (
          <ShopListView service={selectedService}
            onSelectShop={(shopId: number) => { setSelectedShopId(shopId); setStep("vehicles"); }}
            onBack={() => setStep("home")} />
        )}
        {/* Supplier/Shop: that shop's products OR Grocery & Ration: full grocery catalog */}
        {step === "vehicles" && (selectedService?.slug === "grocery-ration" || ((selectedService?.slug === "supplier-shop" || selectedService?.slug === "food-delivery") && selectedShopId !== null)) && waterCards.length === 0 && (
          <ShopProductsView service={selectedService} shopId={selectedShopId} onBack={() => (selectedService?.slug === "supplier-shop" || selectedService?.slug === "food-delivery") ? setStep("shop-list") : setStep("home")}
            onCheckout={() => setStep("material-location")} />
        )}
        {step === "material-quantity" && materialVehicle && (
          <MaterialQuantityView vehicle={materialVehicle} quantity={materialQuantity} setQuantity={setMaterialQuantity}
            onBack={() => setStep("vehicles")} onNext={() => setStep("material-location")} />
        )}
        {step === "material-location" && selectedService?.slug === "material-supply" && (
          <SingleLocationView service={selectedService!} title="Delivery Location" drop={drop}
            onOpenPicker={() => setPickerOpen("drop")}
            onBack={() => setStep("material-quantity")} onNext={loadMaterialShops} loading={loadingCards} />
        )}
        {step === "material-location" && (selectedService?.slug === "supplier-shop" || selectedService?.slug === "food-delivery") && selectedShopId !== null && (
          <SingleLocationView service={selectedService!} title="Delivery Location" drop={drop}
            onOpenPicker={() => setPickerOpen("drop")}
            onBack={() => setStep("vehicles")} onNext={loadShopCards} loading={loadingCards} />
        )}
        {step === "material-location" && selectedService?.slug === "grocery-ration" && (
          <SingleLocationView service={selectedService!} title="Delivery Location" drop={drop}
            onOpenPicker={() => setPickerOpen("drop")}
            onBack={() => setStep("vehicles")} onNext={loadShopCards} loading={loadingCards} />
        )}
        {step === "material-shops" && (
          <MaterialShopsView cards={materialShopCards} bestPriceId={materialShopCards[0]?.priceId}
            selected={selectedShopCard} onSelect={(c) => { setSelectedShopCard(c); setStep("details"); }}
            onBack={() => setStep("material-location")} />
        )}
        {/* Supplier/Shop: price cards (standard fare, reuses waterCards state) */}
        {step === "vehicles" && (selectedService?.slug === "supplier-shop" || selectedService?.slug === "food-delivery") && selectedShopId !== null && waterCards.length > 0 && (
          <VehiclesView service={selectedService} cards={waterCards} distanceKm={0} etaText=""
            selected={selectedCard} onSelect={(c) => { setSelectedCard(c); setStep("details"); }}
            onBack={() => setStep("material-location")} />
        )}
        {/* Machinery: item-type selection → duration → single location → cards */}
        {step === "vehicles" && selectedService?.slug === "machinery-rental" && machineryCards.length === 0 && (
          <ItemTypeSelectView service={selectedService} title="Select Machinery" onBack={() => setStep("home")}
            onSelect={async (v) => { setMaterialVehicle(v); setStep("machinery-duration"); }} />
        )}
        {step === "machinery-duration" && materialVehicle && (
          <MachineryDurationView vehicle={materialVehicle} durationHours={durationHours} setDurationHours={setDurationHours}
            durationDays={durationDays} setDurationDays={setDurationDays}
            schedule={schedule} setSchedule={setSchedule}
            onBack={() => { setMaterialVehicle(null); setStep("vehicles"); }} onNext={() => setStep("machinery-location")} />
        )}
        {step === "machinery-location" && (
          <SingleLocationView service={selectedService!} title="Site / Delivery Location" drop={drop}
            onOpenPicker={() => setPickerOpen("drop")}
            onBack={() => setStep("machinery-duration")} onNext={loadMachineryCards} loading={loadingCards} />
        )}
        {step === "vehicles" && selectedService?.slug === "machinery-rental" && machineryCards.length > 0 && (
          <VehiclesView service={selectedService} cards={machineryCards} distanceKm={0} etaText=""
            selected={selectedCard} onSelect={(c) => { setSelectedCard(c); setStep("details"); }}
            onBack={() => setStep("machinery-location")} />
        )}
        {/* Water: step 1 — select water TYPE (Drinking/Borewell/Construction/20L Cans) → step 2 — tanker SIZE or water-cans-qty → location → price */}
        {step === "water-type" && selectedService?.slug === "water-supply" && (
          <WaterTypeView service={selectedService} onBack={() => setStep("home")}
            onSelect={(v) => {
              setWaterType(v);
              // Borewell rigs go directly to location (no tanker size step)
              if (String(v.slug || "").startsWith("borewell-rig") || v.slug === "borewell-flush") {
                setMaterialVehicle(v);
                setStep("water-location");
              } else if (v.slug === "water-cans-20l") {
                // 20L water cans: go to quantity step (min 5 cans)
                setMaterialVehicle(v);
                setMaterialQuantity(5);
                setStep("water-cans-qty");
              } else {
                setStep("vehicles"); // go to tanker size selection
              }
            }} />
        )}
        {step === "water-cans-qty" && materialVehicle && (
          <WaterCansQtyView vehicle={materialVehicle} quantity={materialQuantity} setQuantity={setMaterialQuantity}
            onBack={() => { setMaterialVehicle(null); setStep("water-type"); }} onNext={() => setStep("water-location")} />
        )}
        {step === "vehicles" && selectedService?.slug === "water-supply" && waterType && waterCards.length === 0 && (
          <WaterSizeView service={selectedService} waterType={waterType} onBack={() => { setWaterType(null); setStep("water-type"); }}
            onSelect={(v) => { setMaterialVehicle(v); setStep("water-location"); }} />
        )}
        {step === "water-location" && (
          <SingleLocationView service={selectedService!} title="Delivery Location" drop={drop}
            onOpenPicker={() => setPickerOpen("drop")}
            onBack={() => setStep(materialVehicle?.slug === "water-cans-20l" ? "water-cans-qty" : "vehicles")} onNext={loadWaterCards} loading={loadingCards} />
        )}
        {step === "vehicles" && selectedService?.slug === "water-supply" && waterCards.length > 0 && (
          <VehiclesView service={selectedService} cards={waterCards} distanceKm={0} etaText=""
            selected={selectedCard} onSelect={(c) => { setSelectedCard(c); setStep("details"); }}
            onBack={() => setStep("water-location")} />
        )}
        {/* Borewell Drilling: rig selection → depth (feet) → site location → live per-foot price */}
        {step === "vehicles" && selectedService?.slug === "borewell-drilling" && borewellCards.length === 0 && (
          <ItemTypeSelectView service={selectedService} title="Select Borewell Rig" onBack={() => setStep("home")}
            onSelect={async (v) => { setMaterialVehicle(v); setStep("borewell-depth"); }} />
        )}
        {step === "borewell-depth" && materialVehicle && (
          <BorewellDepthView vehicle={materialVehicle} depth={borewellDepth} setDepth={setBorewellDepth}
            schedule={schedule} setSchedule={setSchedule}
            onBack={() => { setMaterialVehicle(null); setStep("vehicles"); }} onNext={() => setStep("borewell-location")} />
        )}
        {step === "borewell-location" && (
          <SingleLocationView service={selectedService!} title="Drilling Site Location" drop={drop}
            onOpenPicker={() => setPickerOpen("drop")}
            onBack={() => setStep("borewell-depth")} onNext={loadBorewellCards} loading={loadingCards} />
        )}
        {step === "vehicles" && selectedService?.slug === "borewell-drilling" && borewellCards.length > 0 && (
          <VehiclesView service={selectedService} cards={borewellCards} distanceKm={0} etaText=""
            selected={selectedCard} onSelect={(c) => { setSelectedCard(c); setStep("details"); }}
            onBack={() => setStep("borewell-location")} />
        )}
        {step === "details" && selectedService && (selectedCard || selectedShopCard || (selectedService.slug === "emergency-booking" && selectedCard)) && (
          <DetailsView service={selectedService} card={selectedCard} shopCard={selectedShopCard}
            customer={customer} setCustomer={setCustomer}
            schedule={schedule} setSchedule={setSchedule}
            itemDetails={itemDetails} setItemDetails={setItemDetails}
            weight={weight} setWeight={setWeight}
            quantity={quantity} setQuantity={setQuantity}
            landmark={landmark} setLandmark={setLandmark}
            customerNotes={customerNotes} setCustomerNotes={setCustomerNotes}
            isNight={isNight} setIsNight={setIsNight}
            isExpress={isExpress} setIsExpress={setIsExpress}
            needsHelper={needsHelper} setNeedsHelper={setNeedsHelper}
            onBack={() => {
              if (selectedShopCard) setStep("material-shops");
              else if (selectedService.slug === "machinery-rental") setStep("vehicles");
              else if (selectedService.slug === "water-supply") setStep("vehicles");
              else if (selectedService.slug === "borewell-drilling") setStep("vehicles");
              else if (selectedService.slug === "emergency-booking") setStep("vehicles");
              else setStep("vehicles");
            }}
            onNext={() => setStep("payment")} />
        )}
        {step === "payment" && selectedService && (
          <PaymentView service={selectedService} card={selectedCard} shopCard={selectedShopCard}
            allowedPayments={allowedPayments}
            paymentOption={paymentOption} setPaymentOption={setPaymentOption}
            paymentFile={paymentFile} setPaymentFile={setPaymentFile}
            settings={settings}
            onBack={() => setStep("details")}
            onSubmit={submitBooking} submitting={submitting} />
        )}
        {step === "success" && booking && (
          <SuccessView booking={booking} settings={settings} waLink={waLink}
            onHome={restart} onOrders={() => { setOrdersMobile(booking.customer?.mobile || ""); setStep("orders"); }} />
        )}
        {step === "orders" && (
          <OrdersView orders={orders} ordersMobile={ordersMobile} setOrdersMobile={setOrdersMobile} loadOrders={loadOrders} onCancel={cancelOrder} onHome={restart} />
        )}
        {step === "policies" && <PoliciesView content={content} onBack={() => setStep("home")} />}
      </main>
      <CustomerFooter settings={settings} waLink={waLink} onPolicies={() => setStep("policies")} onOpenAdmin={onOpenAdmin} />
      {pickerOpen && (
        <MapPicker
          open={!!pickerOpen}
          title={pickerOpen === "pickup" ? "Select Pickup Location" : "Select Drop Location"}
          initial={pickerOpen === "pickup" ? pickup : drop}
          onConfirm={(v) => {
            if (pickerOpen === "pickup") setPickup(v);
            else setDrop(v);
            setPickerOpen(null);
            toast.success(`${pickerOpen === "pickup" ? "Pickup" : "Drop"} location set`);
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}
      <CartDrawer onCheckout={() => {
        if (selectedService?.slug !== "supplier-shop" && selectedService?.slug !== "grocery-ration" && selectedService?.slug !== "food-delivery") {
          const shopSvc = services.find((s) => s.slug === "supplier-shop");
          if (shopSvc) selectService(shopSvc);
        }
        setStep("material-location");
      }} />
    </div>
  );
}

/* -------------------- Header -------------------- */
function CustomerHeader({ settings, onOpenAdmin, onHome, onOrders, onPolicies }: any) {
  const [open, setOpen] = useState(false);
  const cart = useCart();
  return (
    <header className="sticky top-0 z-40 bg-brand-black text-white border-b-4 border-brand-yellow shadow-lg">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-3">
        <button onClick={onHome} className="flex items-center gap-2 group">
          <img src="/logo.png" alt="ParcelMaadi" className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-contain flex-shrink-0" style={{ background: "transparent" }} />
          <div className="text-left leading-tight">
            <div className="font-extrabold text-base md:text-lg"><span className="text-brand-red">Parcel</span><span className="text-brand-yellow">Maadi</span></div>
            <div className="text-[10px] text-white/70 -mt-0.5">{settings.tagline || "Fast Local Reliable"}</div>
          </div>
        </button>
        <div className="ml-auto hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-brand-yellow" onClick={onHome}>Home</Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-brand-yellow" onClick={onOrders}>My Orders</Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-brand-yellow" onClick={onPolicies}>Policies</Button>
          <a href={`tel:${settings.contact_1 || "9741433725"}`}>
            <Button size="sm" variant="outline" className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-brand-black bg-transparent">
              <Phone className="w-4 h-4 mr-1" /> Call
            </Button>
          </a>
          {/* Cart icon with badge */}
          <Button size="sm" variant="outline" className="relative border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-brand-black bg-transparent" onClick={() => cart.setIsOpen(true)}>
            <ShoppingBag className="w-4 h-4" />
            {cart.count > 0 && <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cart.count}</span>}
          </Button>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden ml-auto text-white hover:bg-white/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-brand-black text-white border-brand-yellow w-72">
            <SheetHeader>
              <SheetTitle className="text-brand-yellow">Menu</SheetTitle>
              <SheetDescription className="text-white/70">ParcelMaadi</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="ghost" className="justify-start text-white hover:bg-white/10 hover:text-brand-yellow" onClick={() => { onHome(); setOpen(false); }}>Home</Button>
              <Button variant="ghost" className="justify-start text-white hover:bg-white/10 hover:text-brand-yellow" onClick={() => { onOrders(); setOpen(false); }}>My Orders</Button>
              <Button variant="ghost" className="justify-start text-white hover:bg-white/10 hover:text-brand-yellow" onClick={() => { onPolicies(); setOpen(false); }}>Policies</Button>
              <a href={`tel:${settings.contact_1 || "9741433725"}`} className="block">
                <Button variant="outline" className="w-full border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-brand-black bg-transparent">
                  <Phone className="w-4 h-4 mr-2" /> Call {settings.contact_1 || "9741433725"}
                </Button>
              </a>
              <a href={`https://wa.me/${settings.whatsapp_number || "919741433725"}`} target="_blank" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
              </a>
              <Button variant="outline" className="w-full border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-brand-black bg-transparent relative" onClick={() => { cart.setIsOpen(true); setOpen(false); }}>
                <ShoppingBag className="w-4 h-4 mr-2" /> Cart {cart.count > 0 && `(${cart.count})`}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

/* -------------------- Home -------------------- */
/* ─── Borewell Drilling Department — featured homepage section ─── */
function BorewellDepartmentSection({ onSelectBorewell }: { onSelectBorewell: (v: Vehicle) => void }) {
  const [borewellItems, setBorewellItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.getServices().then(async (d) => {
      const waterSvc = (d.services || []).find((s: Service) => s.slug === "water-supply");
      if (!waterSvc) { setLoading(false); return; }
      const items = await api.getServiceItems(waterSvc.id);
      const borewells = (items.vehicles || []).filter((v: Vehicle) =>
        String(v.slug || "").startsWith("borewell-rig") || v.slug === "borewell-flush"
      );
      setBorewellItems(borewells);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-black via-brand-black to-gray-900 py-12 md:py-16">
      {/* animated background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(250,204,21,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(220,38,38,0.1),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-4">
        {/* Department header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-yellow text-brand-black px-4 py-1.5 rounded-full text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" /> PREMIUM BOREWELL DRILLING DEPARTMENT
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Borewell <span className="text-brand-yellow">Drilling</span> Booking
          </h2>
          <p className="text-white/70 mt-3 text-sm md:text-base max-w-2xl mx-auto">
            Book borewell drilling rigs directly from our site. Market-best prices with transparent breakup.
            4″, 6″, 8″ rigs + flushing service — all available now.
          </p>
          <div className="h-1 brand-gradient rounded-full mt-3 mx-auto w-40" />
        </div>

        {/* Borewell vehicle booking cards */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-brand-yellow animate-spin" /></div>
        ) : borewellItems.length === 0 ? (
          <p className="text-center text-white/50 py-8">No borewell rigs available. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {borewellItems.map((v: Vehicle, i: number) => (
              <button key={v.id} onClick={() => onSelectBorewell(v)}
                className="group relative text-left rounded-3xl overflow-hidden border-2 border-white/10 hover:border-brand-yellow transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl bg-white/5 backdrop-blur-sm">
                {/* Image */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  {v.imageUrl ? (
                    <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-yellow/20"><Droplets className="w-12 h-12 text-brand-yellow" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Featured badge on first item */}
                  {i === 0 && (
                    <div className="absolute top-3 right-3 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">★ BEST SELLER</div>
                  )}
                  {/* Price tag from vehicle name */}
                  <div className="absolute bottom-3 left-3">
                    <div className="text-[10px] text-brand-yellow font-semibold uppercase">Starting from</div>
                    <div className="text-2xl font-extrabold text-white">
                      ₹{v.slug === "borewell-rig-4-inch" ? "15,000" : v.slug === "borewell-rig-6-inch" ? "25,000" : v.slug === "borewell-rig-8-inch" ? "40,000" : "5,000"}
                    </div>
                  </div>
                </div>
                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="font-bold text-white text-base leading-tight">{v.name}</div>
                  {v.maxLoad && <div className="text-xs text-brand-yellow font-medium">{v.maxLoad}</div>}
                  {v.recommendedUse && <div className="text-xs text-white/60 line-clamp-2">{v.recommendedUse}</div>}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-white/50">Tap to book</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-yellow group-hover:gap-2 transition-all">
                      Book Now <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-white/60">
          <span className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-yellow" /> Market-best prices
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-yellow" /> Experienced operators
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-yellow" /> All rig sizes (4″/6″/8″)
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-yellow" /> Instant booking confirmation
          </span>
        </div>
      </div>
    </section>
  );
}

function HomeView({ settings, hero, howItWorks, about, trust, services, onSelectService, onOrders, onPolicies, userPincode, setUserPincode }: any) {
  let testimonials: any[] = [];
  let clients: string[] = [];
  try { testimonials = JSON.parse(settings.trust_testimonials || "[]"); } catch {}
  try { clients = JSON.parse(settings.trust_clients || "[]"); } catch {}
  return (
    <div>
      {/* ─── Kannada scrolling slogan ticker — top of page ─── */}
      <div className="bg-brand-black text-brand-yellow py-1.5 overflow-hidden border-b-2 border-brand-yellow">
        <div className="pm-ticker whitespace-nowrap text-sm font-bold tracking-wide">
          <span className="mx-8">ಕನ್ನಡಿಗರಿಂದ ಕನ್ನಡಿಗರಿಗಾಗಿ ಕನ್ನಡಿಗರಿಗೊಂದು</span>
          <span className="mx-8 text-brand-red">●</span>
          <span className="mx-8">Fast · Local · Reliable</span>
          <span className="mx-8 text-brand-red">●</span>
          <span className="mx-8">ಕನ್ನಡಿಗರಿಂದ ಕನ್ನಡಿಗರಿಗಾಗಿ ಕನ್ನಡಿಗರಿಗೊಂದು</span>
          <span className="mx-8 text-brand-red">●</span>
          <span className="mx-8">Fast · Local · Reliable</span>
          <span className="mx-8 text-brand-red">●</span>
          <span className="mx-8">ಕನ್ನಡಿಗರಿಂದ ಕನ್ನಡಿಗರಿಗಾಗಿ ಕನ್ನಡಿಗರಿಗೊಂದು</span>
        </div>
        <style>{`@keyframes pm-ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} } .pm-ticker{animation:pm-ticker 25s linear infinite;display:inline-block}`}</style>
      </div>

      {/* ─── Hero section — clean, image visible ─── */}
      <section className="relative overflow-hidden min-h-[50vh] md:min-h-[60vh] flex items-center bg-brand-black">
        {/* Background image — clearly visible */}
        <div className="absolute inset-0">
          <img src={services[0]?.imageUrl || "/logo.png"} alt="ParcelMaadi delivery" className="w-full h-full object-cover opacity-60" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
        </div>
        {/* Content */}
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-16 text-white w-full z-10">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE — Now Booking Across Karnataka
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
              {hero.title || "Fast Local Reliable Parcel & Goods Delivery"}
            </h1>
            <p className="text-sm md:text-base text-white/90 max-w-md">{hero.subtitle} — {hero.body}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#services"><Button size="lg" className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold h-12 px-8 shadow-xl">
                Book Now <ArrowRight className="w-5 h-5 ml-1" />
              </Button></a>
              <a href={`tel:${settings.contact_1}`}><Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-brand-black bg-transparent h-12 px-8">
                <Phone className="w-5 h-5 mr-2" /> Call to Book
              </Button></a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Announcement bar ─── */}
      {settings.announcement && (
        <div className="bg-brand-red text-white py-2 text-center text-sm font-medium">
          🔔 {settings.announcement}
        </div>
      )}

      {/* ─── COMING SOON BANNER — big, colorful, animated ─── */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-brand-gold to-brand-yellow animate-pulse" style={{ animationDuration: "3s" }} />
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-brand-black/20 rounded-full blur-2xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-8 md:py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-brand-black text-brand-yellow px-4 py-1.5 rounded-full text-xs font-bold mb-3 shadow-lg">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                <span className="w-2 h-2 bg-green-400 rounded-full -ml-3" />
                EXPANDING ACROSS KARNATAKA
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg leading-tight">
                🚀 We're Coming to Your City!
              </h2>
              <p className="text-base md:text-lg text-white/95 font-semibold mt-1 drop-shadow">
                Launching <span className="bg-brand-black text-brand-yellow px-2 py-0.5 rounded-md mx-1">AUGUST</span> — Parcel, Goods, Water, Borewell, Machinery, Grocery & more
              </p>
              <p className="text-xs md:text-sm text-white/80 mt-1">
                ನಮ್ಮ ನಗರಕ್ಕೆ ಬರುತ್ತಿದ್ದೇವೆ · ಆಗಸ್ಟ್‌ನಲ್ಲಿ · Fast · Local · Reliable
              </p>
            </div>
            <div className="flex flex-col gap-2 items-center md:items-end">
              <div className="bg-brand-black text-white rounded-2xl px-6 py-3 shadow-2xl border-2 border-brand-yellow">
                <div className="text-[10px] uppercase tracking-widest text-brand-yellow font-bold">Launching In</div>
                <div className="text-3xl md:text-4xl font-extrabold text-brand-yellow">AUG</div>
                <div className="text-[10px] text-white/70 text-center">2026</div>
              </div>
              <div className="flex gap-2">
                <span className="bg-white/90 text-brand-red px-3 py-1 rounded-full text-xs font-bold shadow-md">Bengaluru</span>
                <span className="bg-white/90 text-brand-red px-3 py-1 rounded-full text-xs font-bold shadow-md">Mysuru</span>
                <span className="bg-white/90 text-brand-red px-3 py-1 rounded-full text-xs font-bold shadow-md">Hubballi</span>
                <span className="bg-white/90 text-brand-red px-3 py-1 rounded-full text-xs font-bold shadow-md">+7 more</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave separator */}
        <div className="relative h-2 bg-brand-black" />
      </section>

      {/* ─── Services grid — clean, images clearly visible ─── */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-8">
        {/* Pincode selector — sets zone for availability filtering */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-3 p-4 rounded-2xl bg-muted/40 border-2 border-dashed border-brand-yellow/40">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-red" />
            <span className="text-sm font-semibold">Deliver to:</span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Enter 6-digit pincode"
            value={userPincode}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
              setUserPincode(v);
              if (v.length === 6) {
                localStorage.setItem("pm_pincode", v);
                toast.success(`Showing services available at ${v}`);
              } else if (v.length === 0) {
                localStorage.removeItem("pm_pincode");
              }
            }}
            className="px-3 py-2 rounded-lg border-2 border-border bg-background text-sm font-mono w-40 text-center focus:border-brand-yellow focus:outline-none"
          />
          {userPincode && userPincode.length === 6 && (
            <button
              onClick={() => { setUserPincode(""); localStorage.removeItem("pm_pincode"); toast.info("Showing all services"); }}
              className="text-xs text-muted-foreground hover:text-brand-red underline"
            >
              Clear
            </button>
          )}
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {userPincode && userPincode.length === 6 ? "✓ Zone filter active — showing only available services" : "Optional — shows services available in your area"}
          </span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Choose Your Service</h2>
          <div className="h-1 brand-gradient rounded-full mt-2 mx-auto w-32" />
          <p className="text-muted-foreground mt-2 text-sm">{services.length} services. One app. Book in 2 minutes.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {services.map((svc: Service) => {
            const isComingSoon = svc.status === "Coming Soon";
            return (
            <button key={svc.id} onClick={() => {
              if (isComingSoon) {
                toast.info(`🚀 ${svc.name} is Coming Soon! Stay tuned.`);
                return;
              }
              onSelectService(svc);
            }}
              className="group text-left rounded-2xl border-2 border-border bg-card overflow-hidden hover:border-brand-yellow hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              {/* Image */}
              <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                {svc.imageUrl ? (
                  <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" style={{ filter: isComingSoon ? "blur(2px) grayscale(0.5) brightness(0.7)" : "none" }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ServiceIcon name={svc.icon} className="w-12 h-12 text-brand-black/40" /></div>
                )}
                {/* Icon badge */}
                <div className="absolute top-2 left-2 w-9 h-9 rounded-lg bg-brand-yellow flex items-center justify-center shadow-md group-hover:scale-110 transition-transform z-10">
                  <ServiceIcon name={svc.icon} className="w-5 h-5 text-brand-black" />
                </div>
                {/* Price badge */}
                {svc.startingPriceText && !isComingSoon && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10 max-w-[60%] truncate">
                    {svc.startingPriceText}
                  </div>
                )}
                {isComingSoon && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10">Soon</div>
                )}
              </div>
              {/* ─── NAME BANNER (colored, bold, BIG) ─── */}
              <div className="bg-gradient-to-r from-brand-red to-brand-yellow px-3 py-2.5">
                <div className="font-extrabold text-sm md:text-base text-white leading-tight drop-shadow-sm" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                  {svc.name}
                </div>
              </div>
              {/* Description below */}
              <div className="p-2.5">
                <div className="text-xs text-muted-foreground line-clamp-2 leading-snug">{svc.description}</div>
                <div className={`mt-1.5 text-xs font-bold ${isComingSoon ? "text-amber-600" : "text-brand-red"} group-hover:gap-1.5 transition-all flex items-center gap-1`}>
                  {isComingSoon ? "🚀 Coming Soon" : <>Book now <ArrowRight className="w-3 h-3" /></>}
                </div>
              </div>
            </button>
            );
          })}
        </div>
      </section>

      <section className="bg-brand-black text-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-yellow">{howItWorks.title || "How It Works"}</h2>
            <p className="text-white/70 mt-1">{howItWorks.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Package, title: "1. Choose Service", desc: "Pick from 8 services and see vehicle price cards." },
              { icon: MapPin, title: "2. Set Pickup & Drop", desc: "Use the map picker to search or drag the pin. GPS optional." },
              { icon: CheckCircle2, title: "3. Confirm & Book", desc: "See transparent fare breakup with GST & charges, then book instantly." },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-brand-yellow flex items-center justify-center mb-3">
                  <s.icon className="w-7 h-7 text-brand-black" />
                </div>
                <h3 className="font-bold text-lg text-brand-yellow">{s.title}</h3>
                <p className="text-white/70 text-sm mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold">{trust.title || "Trusted by Local Businesses"}</h2>
          <p className="text-muted-foreground mt-1">{settings.trust_coverage || "Karnataka-wide coverage"}</p>
        </div>
        {clients.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {clients.map((c: string, i: number) => (
              <Badge key={i} variant="outline" className="text-sm px-4 py-2 bg-brand-yellow/10 border-brand-yellow">{c}</Badge>
            ))}
          </div>
        )}
        {testimonials.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t: any, i: number) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-1 mb-2">{[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 fill-brand-yellow text-brand-yellow" />)}</div>
                  <p className="text-sm italic">"{t.text}"</p>
                  <div className="text-xs font-semibold mt-2 text-brand-red">— {t.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold">{about.title || "About ParcelMaadi"}</h2>
            <p className="text-muted-foreground mt-3 whitespace-pre-line">{about.body}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-brand-yellow/20 border border-brand-yellow p-3"><div className="text-2xl font-extrabold text-brand-red">8+</div><div className="text-xs text-muted-foreground">Services</div></div>
              <div className="rounded-xl bg-brand-yellow/20 border border-brand-yellow p-3"><div className="text-2xl font-extrabold text-brand-red">2 min</div><div className="text-xs text-muted-foreground">Booking time</div></div>
              <div className="rounded-xl bg-brand-yellow/20 border border-brand-yellow p-3"><div className="text-2xl font-extrabold text-brand-red">Live</div><div className="text-xs text-muted-foreground">Pricing</div></div>
              <div className="rounded-xl bg-brand-yellow/20 border border-brand-yellow p-3"><div className="text-2xl font-extrabold text-brand-red">24/7</div><div className="text-xs text-muted-foreground">Support</div></div>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-brand-yellow bg-card p-6">
            <h3 className="font-bold text-lg mb-3">Why choose ParcelMaadi?</h3>
            <ul className="space-y-3">
              {["Map picker with search & drag-pin","Transparent fare breakup — no hidden charges","GST, Delivery & Platform charges shown clearly","Manual fallback when Maps API unavailable","Pay Later, Advance or Full UPI options","Live admin price master — always latest rates"].map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" /><span>{t}</span></li>
              ))}
            </ul>
            <Button className="w-full mt-4 bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold" onClick={onOrders}><PackageSearch className="w-4 h-4 mr-2" /> Track My Orders</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------- Location (map picker) -------------------- */
function LocationView({ service, pickup, drop, onOpenPicker, manualKm, setManualKm, distanceKm, distanceMethod, etaText, calculateDistance, loadingCards, onBack, onNext }: any) {
  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-6">
      <Button variant="ghost" size="sm" className="mb-2" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Stepper step={2} />
      <Card className="mt-3">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><MapPin className="w-5 h-5 text-brand-red" /> Pickup & Drop Location</CardTitle>
          <CardDescription className="text-xs">{service.name} · Tap to open map picker</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Pickup */}
          <div className="rounded-xl border-2 border-brand-yellow/40 p-3 bg-brand-yellow/5">
            <div className="flex items-center justify-between mb-2 gap-2">
              <Label className="font-bold flex items-center gap-1 text-sm flex-shrink-0"><Navigation className="w-4 h-4 text-brand-red" /> Pickup</Label>
              <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold h-9 text-xs flex-shrink-0" onClick={() => onOpenPicker("pickup")}>
                <MapPin className="w-3 h-3 mr-1" /> Select
              </Button>
            </div>
            {pickup.address ? (
              <div className="text-sm text-foreground bg-white/50 rounded-md px-3 py-2 break-words leading-snug">{pickup.address}</div>
            ) : (
              <div className="text-sm text-muted-foreground italic px-3 py-2">No pickup selected — tap "Select" above</div>
            )}
            {pickup.lat != null && (
              <div className="text-[10px] text-muted-foreground mt-1 font-mono flex items-center gap-2 flex-wrap">
                <span>📍 {pickup.lat.toFixed(4)}, {pickup.lng?.toFixed(4)}</span>
                {pickup.mapLink && <a href={pickup.mapLink} target="_blank" className="text-brand-red underline">Open Map ↗</a>}
              </div>
            )}
          </div>

          {/* Drop */}
          <div className="rounded-xl border-2 border-brand-red/40 p-3 bg-red-50">
            <div className="flex items-center justify-between mb-2 gap-2">
              <Label className="font-bold flex items-center gap-1 text-sm flex-shrink-0"><MapPin className="w-4 h-4 text-brand-red" /> Drop</Label>
              <Button size="sm" className="bg-brand-red text-white hover:bg-brand-red/90 h-9 text-xs flex-shrink-0" onClick={() => onOpenPicker("drop")}>
                <MapPin className="w-3 h-3 mr-1" /> Select
              </Button>
            </div>
            {drop.address ? (
              <div className="text-sm text-foreground bg-white/50 rounded-md px-3 py-2 break-words leading-snug">{drop.address}</div>
            ) : (
              <div className="text-sm text-muted-foreground italic px-3 py-2">No drop selected — tap "Select" above</div>
            )}
            {drop.lat != null && (
              <div className="text-[10px] text-muted-foreground mt-1 font-mono flex items-center gap-2 flex-wrap">
                <span>📍 {drop.lat.toFixed(4)}, {drop.lng?.toFixed(4)}</span>
                {drop.mapLink && <a href={drop.mapLink} target="_blank" className="text-brand-red underline">Open Map ↗</a>}
              </div>
            )}
          </div>

          {/* Distance & ETA — auto-calculated, shows results prominently */}
          <div className="rounded-xl border-2 border-brand-yellow/40 p-3 bg-brand-yellow/5">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-bold text-sm flex items-center gap-1"><Zap className="w-4 h-4 text-brand-red" /> Distance & ETA</Label>
              <Button size="sm" onClick={calculateDistance} disabled={loadingCards} variant="outline" className="h-8 text-xs">
                {loadingCards ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />} Recalculate
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white px-3 py-2.5 text-center border">
                <div className="text-[10px] text-muted-foreground uppercase">Distance</div>
                <div className="font-extrabold text-base text-brand-red">{distanceKm != null ? `${distanceKm} km` : (pickup.lat != null && drop.lat != null ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "—")}</div>
              </div>
              <div className="rounded-lg bg-white px-3 py-2.5 text-center border">
                <div className="text-[10px] text-muted-foreground uppercase">ETA</div>
                <div className="font-extrabold text-base text-brand-red">{etaText || (pickup.lat != null && drop.lat != null ? "..." : "—")}</div>
              </div>
            </div>
            <div className="mt-2">
              <Label className="text-[10px] text-muted-foreground">Manual KM fallback (if GPS/Maps unavailable)</Label>
              <Input type="number" step="0.1" placeholder="e.g. 12.5" value={manualKm} onChange={(e) => setManualKm(e.target.value)} className="h-9 text-sm" />
            </div>
            {distanceMethod && <div className="text-[9px] text-muted-foreground mt-1">Method: {distanceMethod}</div>}
          </div>

          {/* Bottom CTA — full width, prominent */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onBack} className="flex-shrink-0 h-11"><ChevronLeft className="w-4 h-4" /></Button>
            <Button onClick={onNext} disabled={loadingCards} className="flex-1 bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold h-11 text-sm shadow-lg">
              {loadingCards ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Show Vehicle Prices <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Vehicle Price Cards -------------------- */
function VehiclesView({ service, cards, distanceKm, etaText, selected, onSelect, onBack }: any) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Stepper step={2} done={1} />
      <Card className="mt-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-brand-red" /> Choose Vehicle — {service.name}</CardTitle>
          <CardDescription>{distanceKm} km · ETA {etaText || "—"} · Compare prices and select</CardDescription>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No active vehicles for this service. Please contact admin.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cards.map((c: FareCard) => {
                const v = c.price.vehicle;
                const isSel = selected?.price.id === c.price.id;
                return (
                  <button key={c.price.id} onClick={() => onSelect(c)}
                    className={`text-left rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg ${isSel ? "border-brand-yellow ring-2 ring-brand-yellow" : "border-border hover:border-brand-yellow/50"}`}>
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {v?.imageUrl ? (
                        <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-yellow"><Truck className="w-12 h-12 text-brand-black" /></div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="font-bold text-base">{v?.name || c.price.itemType}</div>
                      {v?.maxLoad && <div className="text-xs text-muted-foreground">Load: {v.maxLoad}</div>}
                      {v?.recommendedUse && <div className="text-[11px] text-muted-foreground line-clamp-2">{v.recommendedUse}</div>}
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="w-3 h-3" /> {etaText || "ETA on confirm"}</div>
                      {c.breakup.manualQuote ? (
                        <div className="pt-2"><Badge className="bg-brand-red text-white">Manual Quote</Badge></div>
                      ) : (
                        <div className="pt-2 flex items-baseline gap-1">
                          <span className="text-xl font-extrabold text-brand-red">₹{c.breakup.finalEstimate}</span>
                        </div>
                      )}
                      <div className={`mt-2 w-full rounded-lg py-2 text-center text-xs font-bold ${isSel ? "bg-brand-yellow text-brand-black" : "bg-muted text-foreground"}`}>
                        {isSel ? "✓ Selected" : "Select"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Details -------------------- */
function DetailsView({ service, card, shopCard, customer, setCustomer, schedule, setSchedule, itemDetails, setItemDetails, weight, setWeight, quantity, setQuantity, landmark, setLandmark, customerNotes, setCustomerNotes, isNight, setIsNight, isExpress, setIsExpress, needsHelper, setNeedsHelper, onBack, onNext }: any) {
  const breakup = card?.breakup;
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Stepper step={3} done={2} />
      <div className="grid md:grid-cols-2 gap-4 mt-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">Your Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="name">Full name *</Label>
              <Input id="name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile (10 digits, starts 6-9) *</Label>
              <Input id="mobile" value={customer.mobile} onChange={(e) => setCustomer({ ...customer, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="9876543210" inputMode="numeric" maxLength={10} />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label htmlFor="date">Date</Label><Input id="date" type="date" value={schedule.date} onChange={(e) => setSchedule({ ...schedule, date: e.target.value })} /></div>
              <div><Label htmlFor="time">Time</Label><Input id="time" type="time" value={schedule.time} onChange={(e) => setSchedule({ ...schedule, time: e.target.value })} /></div>
            </div>
            <div>
              <Label htmlFor="landmark">Landmark</Label>
              <Input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near Metro station / opposite mall" />
            </div>
            <div>
              <Label htmlFor="item">Item details</Label>
              <Input id="item" value={itemDetails} onChange={(e) => setItemDetails(e.target.value)} placeholder="e.g. 2 cardboard boxes" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label htmlFor="weight">Weight</Label><Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 5 kg" /></div>
              <div><Label htmlFor="qty">Quantity</Label><Input id="qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 2" /></div>
            </div>
            <div>
              <Label htmlFor="notes">Notes for driver / admin</Label>
              <Textarea id="notes" value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Any special instructions" rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {breakup && (
            <Card>
              <CardHeader className="bg-brand-yellow/20">
                <CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-brand-red" /> Fare Breakup</CardTitle>
                <CardDescription>{service.name} · {card.price.vehicle?.name} · {(breakup.calculationNotes || []).find((n: string) => n.startsWith("Distance"))?.split(":")[0] || ""}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {breakup.manualQuote ? (
                  <div className="text-center py-4"><Badge className="bg-brand-red text-white mb-2">Manual Quote</Badge><p className="text-sm text-muted-foreground">Admin will confirm the price after booking.</p></div>
                ) : (
                  <div className="space-y-1.5 text-sm">
                    {/* Department + Service info */}
                    <div className="bg-muted/50 rounded-lg p-2 mb-2 text-xs">
                      <div className="font-bold text-brand-black">{service?.name}</div>
                      <div className="text-muted-foreground">Vehicle: {card?.price?.vehicle?.name || "—"}</div>
                      <div className="text-muted-foreground">Booking Time: {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    {/* Simplified bill: Base, Delivery, Platform, GST, Total */}
                    <FareRow label="Base Amount" value={(breakup.baseFare || 0) + (breakup.distanceCharge || 0) + (breakup.nightCharge || 0) + (breakup.expressCharge || 0) + (breakup.tollParking || 0) + (breakup.extraCharge || 0)} />
                    {((breakup.loadingCharge || 0) + (breakup.helperCharge || 0) + (breakup.waitingCharge || 0)) > 0 && <FareRow label="Delivery Charges" value={(breakup.loadingCharge || 0) + (breakup.helperCharge || 0) + (breakup.waitingCharge || 0)} />}
                    {((breakup.platformFee || 0) + (breakup.handlingFee || 0)) > 0 && <FareRow label="Platform Charges" value={(breakup.platformFee || 0) + (breakup.handlingFee || 0)} />}
                    <FareRow label="GST" value={breakup.gst || 0} />
                    <Separator className="my-2" />
                    <div className="flex justify-between font-extrabold text-base"><span>Total Amount</span><span className="text-brand-red">₹{breakup.finalEstimate}</span></div>
                    {breakup.advanceAmount > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground"><span>Advance payable now ({card.price.advancePercent}%)</span><span>₹{breakup.advanceAmount}</span></div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Optional add-ons</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={isNight} onChange={(e) => setIsNight(e.target.checked)} className="w-4 h-4 accent-brand-red" /> Night charge ({card?.price.nightChargePercent || 0}%)</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={isExpress} onChange={(e) => setIsExpress(e.target.checked)} className="w-4 h-4 accent-brand-red" /> Express delivery ({card?.price.expressChargePercent || 0}%)</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={needsHelper} onChange={(e) => setNeedsHelper(e.target.checked)} className="w-4 h-4 accent-brand-red" /> Helper needed (₹{card?.price.helperCharge || 0})</label>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
        <Button onClick={onNext} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">Continue to Payment <ChevronRight className="w-4 h-4 ml-1" /></Button>
      </div>
    </div>
  );
}

function FareRow({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>₹{value}</span></div>;
}

/* -------------------- Payment -------------------- */
function PaymentView({ service, card, shopCard, allowedPayments, paymentOption, setPaymentOption, paymentFile, setPaymentFile, settings, onBack, onSubmit, submitting }: any) {
  const upiId = settings.upi_id || "parcelmaadi@upi";
  const fare = card?.breakup;
  const advance = shopCard?.advanceAmount || fare?.advanceAmount || 0;
  const total = shopCard?.finalLandedPrice || fare?.finalEstimate || 0;
  const isManual = fare?.manualQuote && !shopCard;
  const [termsAccepted, setTermsAccepted] = useState(false);
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Stepper step={4} done={3} />
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>Payment Option</CardTitle>
          <CardDescription>{service.name} · {isManual ? "Manual quote" : `Total ₹${total}`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allowedPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment options enabled. Contact admin.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {allowedPayments.map((opt: string) => {
                const desc = opt === "Pay Advance" ? (advance ? `₹${advance} now` : "Advance now") : opt === "Pay Full Amount" ? (total ? `₹${total} now` : "Full now") : "Pay cash after delivery";
                return (
                  <button key={opt} onClick={() => setPaymentOption(opt)}
                    className={`text-left rounded-xl border-2 p-3 transition-all ${paymentOption === opt ? "border-brand-yellow bg-brand-yellow/10" : "border-border hover:border-brand-yellow/50"}`}>
                    <div className="font-semibold text-sm">{opt}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </button>
                );
              })}
            </div>
          )}

          {(paymentOption === "Pay Advance" || paymentOption === "Pay Full Amount") && !isManual && (
            <div className="rounded-xl border-2 border-brand-yellow p-4 bg-brand-yellow/5">
              <h4 className="font-bold text-sm mb-2">Pay via UPI</h4>
              <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-lg bg-white border-2 border-brand-black flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src={settings.upi_qr_image || "/upi-qr.jpg"}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm">UPI ID: <span className="font-mono font-semibold">{upiId}</span></div>
                  <div className="text-sm">Amount: <span className="font-bold text-brand-red">₹{paymentOption === "Pay Advance" ? advance : total}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Pay and upload screenshot. Admin will verify.</p>
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="screenshot" className="text-xs">Upload payment screenshot / proof (JPG/PNG/WEBP/PDF, max 5MB)</Label>
                <Input id="screenshot" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setPaymentFile(e.target.files?.[0] || null)} />
                {paymentFile && <div className="text-xs text-green-600 mt-1">✓ {paymentFile.name} ({(paymentFile.size / 1024).toFixed(0)} KB)</div>}
              </div>
            </div>
          )}

          {/* Terms acceptance checkbox — required before booking */}
          <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border-2 border-border p-3 hover:border-brand-yellow/50 transition-colors">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-5 h-5 mt-0.5 accent-brand-red flex-shrink-0" />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I agree to ParcelMaadi's <button type="button" onClick={() => window.open("/", "_self")} className="text-brand-red underline font-medium">Terms & Conditions</button> and <button type="button" className="text-brand-red underline font-medium">Privacy Policy</button>. Fare is an estimate; final amount may vary based on actual distance & waiting time. Duplicate bookings within 2 minutes are blocked.
            </span>
          </label>

          {/* Sticky bottom CTA for mobile + regular for desktop */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onBack} className="flex-shrink-0"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
            <Button
              onClick={onSubmit}
              disabled={submitting || !termsAccepted}
              className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white font-bold h-12 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {submitting ? "Submitting..." : "Confirm Booking"}
            </Button>
          </div>
          {!termsAccepted && <p className="text-xs text-center text-muted-foreground">Please accept Terms to continue</p>}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Success -------------------- */
function SuccessView({ booking, settings, waLink, onHome, onOrders }: any) {
  const waText = `Hello ParcelMaadi! I just booked ${booking.service?.name} (${booking.vehicle?.name || ""}). Order ID: ${booking.bookingId}. Amount: ₹${booking.finalEstimate || "manual quote"}. Please confirm.`;

  // Build a complete .txt receipt for the booking
  const buildOrderReceipt = () => {
    const lines: string[] = [];
    lines.push("================================================");
    lines.push("          ParcelMaadi - Order Receipt          ");
    lines.push("================================================");
    lines.push("");
    lines.push(`Order ID       : ${booking.bookingId}`);
    lines.push(`Booking Date   : ${new Date(booking.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);
    lines.push(`Status         : ${booking.status}`);
    lines.push("");
    lines.push("--- Service ---");
    lines.push(`Service        : ${booking.service?.name || "—"}`);
    lines.push(`Vehicle/Item   : ${booking.vehicle?.name || "—"}`);
    lines.push("");
    lines.push("--- Pickup & Drop ---");
    lines.push(`Pickup Address : ${booking.pickupAddress || "—"}`);
    if (booking.pickupMapLink) lines.push(`Pickup Map     : ${booking.pickupMapLink}`);
    lines.push(`Drop Address   : ${booking.dropAddress || "—"}`);
    if (booking.dropMapLink) lines.push(`Drop Map       : ${booking.dropMapLink}`);
    lines.push(`Distance       : ${booking.distanceKm ? `${booking.distanceKm} km (${booking.distanceMethod || "estimated"})` : "—"}`);
    if (booking.etaText) lines.push(`ETA            : ${booking.etaText}`);
    lines.push("");
    lines.push("--- Schedule ---");
    lines.push(`Date           : ${booking.scheduleDate || "ASAP"}`);
    lines.push(`Time           : ${booking.scheduleTime || "—"}`);
    lines.push("");
    lines.push("--- Estimate ---");
    lines.push(`Final Estimate : ${booking.finalEstimate ? `₹${booking.finalEstimate}` : "Manual quote"}`);
    if (booking.paymentReceived != null) lines.push(`Payment Received: ₹${booking.paymentReceived}`);
    lines.push(`Payment Option : ${booking.paymentOption || "—"}`);
    lines.push(`Payment Status : ${booking.paymentStatus || "—"}`);
    lines.push("");
    lines.push("--- Customer Details ---");
    lines.push(`Name           : ${booking.customer?.name || "—"}`);
    lines.push(`Mobile         : ${booking.customer?.mobile || "—"}`);
    if (booking.customer?.email) lines.push(`Email          : ${booking.customer.email}`);
    if (booking.itemDetails) lines.push(`Item Details   : ${booking.itemDetails}`);
    if (booking.weight) lines.push(`Weight         : ${booking.weight}`);
    if (booking.quantity) lines.push(`Quantity       : ${booking.quantity}`);
    if (booking.landmark) lines.push(`Landmark       : ${booking.landmark}`);
    if (booking.customerNotes) lines.push(`Customer Notes : ${booking.customerNotes}`);
    lines.push("");
    if (booking.driverName) {
      lines.push("--- Driver ---");
      lines.push(`Driver Name    : ${booking.driverName}`);
      lines.push(`Driver Mobile  : ${booking.driverMobile || "—"}`);
      lines.push("");
    }
    lines.push("--- HP Enterprise Contact ---");
    lines.push(`Operated By    : HP Enterprise`);
    lines.push(`GSTIN          : ${settings.gstin || "29ANZPH4067Q1ZS"}`);
    lines.push(`Contact        : ${settings.contact_1 || "9741433725"}`);
    lines.push(`Email          : ${settings.email || "parcelmaadipm@gmail.com"}`);
    if (settings.company_address) lines.push(`Address        : ${settings.company_address}`);
    lines.push(`Website        : ${settings.website || "parcelmaadi.com"}`);
    lines.push("");
    lines.push("================================================");
    lines.push("  This is a computer-generated receipt. Fare is");
    lines.push("  an estimate; final amount may vary based on");
    lines.push("  actual distance & waiting time.");
    lines.push("================================================");
    return lines.join("\n");
  };

  const downloadReceipt = () => {
    const text = buildOrderReceipt();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ParcelMaadi-Order-${booking.bookingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Order details downloaded");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card className="overflow-hidden">
        <div className="bg-green-600 text-white p-6 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-2" />
          <h2 className="text-2xl font-extrabold">Booking Confirmed!</h2>
          <p className="text-white/90 text-sm">Your booking has been pushed to admin in real-time. Driver will be assigned shortly.</p>
        </div>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between bg-brand-yellow/20 rounded-lg p-3">
            <span className="text-sm font-medium">Order ID</span>
            <span className="font-mono font-bold text-brand-red">{booking.bookingId}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(booking.bookingId); toast.success("Order ID copied"); }}>
            <Copy className="w-3 h-3 mr-1" /> Copy Order ID
          </Button>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Detail label="Service" value={booking.service?.name} />
            <Detail label="Vehicle" value={booking.vehicle?.name || "—"} />
            <Detail label="Pickup" value={booking.pickupAddress || "—"} />
            <Detail label="Drop" value={booking.dropAddress || "—"} />
            <Detail label="Distance" value={booking.distanceKm ? `${booking.distanceKm} km` : "—"} />
            <Detail label="Schedule" value={`${booking.scheduleDate || "ASAP"} ${booking.scheduleTime || ""}`} />
            <Detail label="Estimate" value={booking.finalEstimate ? `₹${booking.finalEstimate}` : "Manual quote"} />
            <Detail label="Payment" value={booking.paymentOption} />
            <Detail label="Status" value={<Badge className="bg-brand-yellow text-brand-black">{booking.status}</Badge>} />
          </div>
          {booking.pickupMapLink && <a href={booking.pickupMapLink} target="_blank" className="block text-xs text-brand-red underline">View pickup on map ↗</a>}
          {booking.dropMapLink && <a href={booking.dropMapLink} target="_blank" className="block text-xs text-brand-red underline">View drop on map ↗</a>}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <a href={waLink(waText)} target="_blank" className="flex-1"><Button className="w-full bg-green-600 hover:bg-green-700 text-white"><MessageCircle className="w-4 h-4 mr-2" /> Send on WhatsApp</Button></a>
            <a href={`tel:${settings.contact_1}`} className="flex-1"><Button variant="outline" className="w-full border-brand-black"><Phone className="w-4 h-4 mr-2" /> Call Support</Button></a>
          </div>
          <Button onClick={downloadReceipt} className="w-full bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold h-11">
            <Download className="w-4 h-4 mr-2" /> Download Order Details
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onHome}><HomeIcon className="w-4 h-4 mr-2" /> New Booking</Button>
            <Button variant="ghost" className="flex-1" onClick={onOrders}><PackageSearch className="w-4 h-4 mr-2" /> My Orders</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-md border border-border p-2"><div className="text-[10px] uppercase text-muted-foreground">{label}</div><div className="text-sm font-medium truncate">{value}</div></div>;
}

/* -------------------- Orders -------------------- */
function OrdersView({ orders, ordersMobile, setOrdersMobile, loadOrders, onCancel, onHome }: any) {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  // Auto-refresh orders every 15s so customer sees status updates live
  useEffect(() => {
    if (orders.length === 0) return;
    const t = setInterval(() => {
      loadOrders().then(() => setLastRefresh(new Date())).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, [orders.length > 0, ordersMobile]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PackageSearch className="w-5 h-5 text-brand-red" /> My Bookings</CardTitle>
          <CardDescription>Enter your mobile number to view/cancel your bookings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="10-digit mobile" value={ordersMobile} inputMode="numeric" maxLength={10}
              onChange={(e) => setOrdersMobile(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && loadOrders()} />
            <Button onClick={loadOrders} className="bg-brand-black hover:bg-brand-black/80"><Search className="w-4 h-4 mr-1" /> Find</Button>
          </div>
          {orders.length > 0 && (
            <>
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-1.5 text-xs">
                <span className="flex items-center gap-1.5 text-green-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="font-semibold">LIVE</span>
                  <span className="text-green-700">Auto-refreshing 15s{lastRefresh ? ` · Last: ${lastRefresh.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}` : ""}</span>
                </span>
                <button onClick={() => { loadOrders(); setLastRefresh(new Date()); }} className="text-green-800 underline">Refresh</button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pm-scroll">
              {orders.map((b: Booking) => (
                <div key={b.id} className="rounded-xl border-2 border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-brand-red">{b.bookingId}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{b.service?.name} · {b.vehicle?.name || ""}</div>
                  <div className="text-xs mt-1 truncate">{b.pickupAddress?.slice(0, 40)} → {b.dropAddress?.slice(0, 40)}</div>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span>{new Date(b.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                    <span className="font-bold">{b.finalEstimate ? `₹${b.finalEstimate}` : "Manual quote"}</span>
                  </div>
                  {b.driverName && <div className="mt-2 text-xs bg-brand-yellow/20 rounded p-2">Driver: <b>{b.driverName}</b> ({b.driverMobile})<a href={`tel:${b.driverMobile}`}><Button size="sm" variant="ghost" className="h-6 ml-2 px-2"><Phone className="w-3 h-3 mr-1" />Call</Button></a></div>}
                  {["New", "Pending"].includes(b.status) && (
                    <Button size="sm" variant="outline" className="mt-2 text-red-600 border-red-300" onClick={() => onCancel(b.bookingId)}>Cancel Booking</Button>
                  )}
                </div>
              ))}
              </div>
            </>
          )}
          <Button variant="ghost" className="w-full" onClick={onHome}><HomeIcon className="w-4 h-4 mr-2" /> Back to Home</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    New: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    Assigned: "bg-purple-100 text-purple-800 border-purple-300",
    "Driver Assigned": "bg-purple-100 text-purple-800 border-purple-300",
    "Pickup Started": "bg-cyan-100 text-cyan-800 border-cyan-300",
    "Picked Up": "bg-indigo-100 text-indigo-800 border-indigo-300",
    "In Progress": "bg-orange-100 text-orange-800 border-orange-300",
    Delivered: "bg-green-100 text-green-800 border-green-300",
    Completed: "bg-green-600 text-white border-green-700",
    Cancelled: "bg-red-100 text-red-800 border-red-300",
  };
  return <Badge className={map[status] || "bg-muted text-foreground"} variant="outline">{status}</Badge>;
}

/* -------------------- Policies -------------------- */
function PoliciesView({ content, onBack }: any) {
  const [tab, setTab] = useState<"terms" | "privacy" | "refund">("terms");
  const cur = content[tab] || {};
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-brand-red" /> Policies & Legal</CardTitle>
          <CardDescription>HP Enterprise · GSTIN 29ANZPH4067Q1ZS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {(["terms", "privacy", "refund"] as const).map((t) => (
              <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} className={tab === t ? "bg-brand-yellow text-brand-black" : ""} onClick={() => setTab(t)}>
                {t === "terms" ? "Terms" : t === "privacy" ? "Privacy" : "Refund"}
              </Button>
            ))}
          </div>
          <h3 className="font-bold text-lg mb-2">{cur.title}</h3>
          {cur.subtitle && <p className="text-sm text-muted-foreground mb-2">{cur.subtitle}</p>}
          <div className="text-sm whitespace-pre-line text-foreground/90">{cur.body}</div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Water Type Selection (Drinking/Borewell/Construction) -------------------- */
function WaterTypeView({ service, onSelect, onBack }: any) {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.getServiceItems(service.id).then((d) => {
      // Water types: drinking, borewell (water supply), construction, PLUS borewell drilling rigs
      const types = (d.vehicles || []).filter((v: Vehicle) =>
        ["drinking-water", "borewell-water", "construction-water", "borewell-rig-4-inch", "borewell-rig-6-inch", "borewell-rig-8-inch", "borewell-flush", "water-cans-20l"].includes(v.slug || "")
      );
      setItems(types);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [service.id]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-brand-red" /> Select Water Type — {service.name}</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> :
            items.length === 0 ? <p className="text-muted-foreground text-center py-8">No water types available.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {items.map((v: Vehicle) => (
                  <button key={v.id} onClick={() => onSelect(v)} className="text-left rounded-2xl border-2 border-border overflow-hidden hover:border-brand-yellow hover:shadow-lg transition-all hover:-translate-y-0.5">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {v.imageUrl ? <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center bg-brand-yellow"><Droplets className="w-10 h-10 text-brand-black" /></div>}
                    </div>
                    <div className="p-3"><div className="font-bold text-sm">{v.name}</div>{v.recommendedUse && <div className="text-xs text-muted-foreground mt-1">{v.recommendedUse}</div>}</div>
                  </button>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Water Tanker Size Selection (2KL/4KL/6KL/12KL) -------------------- */
function WaterSizeView({ service, waterType, onSelect, onBack }: any) {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.getServiceItems(service.id).then((d) => {
      // Filter to tanker SIZES only (2kl/4kl/6kl/12kl) — not water types
      const sizes = (d.vehicles || []).filter((v: Vehicle) => ["2kl", "4kl", "6kl", "12kl"].includes(v.slug || ""));
      setItems(sizes);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [service.id]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-brand-red" /> Select Tanker Size</CardTitle>
          <CardDescription>Water type: {waterType?.name} · Choose tanker capacity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> :
            items.length === 0 ? <p className="text-muted-foreground text-center py-8">No tanker sizes available.</p> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {items.map((v: Vehicle) => (
                  <button key={v.id} onClick={() => onSelect(v)} className="text-left rounded-2xl border-2 border-border overflow-hidden hover:border-brand-yellow hover:shadow-lg transition-all hover:-translate-y-0.5">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {v.imageUrl ? <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center bg-brand-yellow"><Droplets className="w-10 h-10 text-brand-black" /></div>}
                    </div>
                    <div className="p-3"><div className="font-bold text-sm">{v.name}</div>{v.maxLoad && <div className="text-xs text-muted-foreground">{v.maxLoad}</div>}{v.recommendedUse && <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{v.recommendedUse}</div>}</div>
                  </button>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Water Cans (20L) Quantity — min 5 cans -------------------- */
function WaterCansQtyView({ vehicle, quantity, setQuantity, onBack, onNext }: any) {
  const MIN_CANS = 5;
  const PER_CAN_RATE = 60; // ₹60 per 20L can (admin-editable via Price Master)
  const safeQty = Math.max(MIN_CANS, Number(quantity) || MIN_CANS);
  const cansCost = safeQty * PER_CAN_RATE;
  const perKmRate = 15; // ₹15/km delivery (added at booking time)

  const setSafeQty = (v: number) => {
    const n = Number(v) || 0;
    setQuantity(Math.max(MIN_CANS, n));
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-brand-red" /> 20L Water Cans — Quantity</CardTitle>
          <CardDescription>{vehicle.name} · Minimum {MIN_CANS} cans per order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Number of 20L cans <span className="text-xs text-muted-foreground">(min {MIN_CANS})</span></Label>
            <Input
              type="number"
              min={MIN_CANS}
              step="1"
              value={quantity}
              onChange={(e) => setSafeQty(Number(e.target.value))}
              onBlur={(e) => { if (Number(e.target.value) < MIN_CANS) { setQuantity(MIN_CANS); toast.info(`Minimum ${MIN_CANS} cans required`); } }}
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuantity(n)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${quantity === n ? "border-brand-yellow bg-brand-yellow/10" : "border-border"}`}
                >
                  {n} cans
                </button>
              ))}
            </div>
            {Number(quantity) < MIN_CANS && (
              <p className="text-xs text-brand-red mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Minimum {MIN_CANS} cans required. Quantity adjusted to {MIN_CANS}.</p>
            )}
          </div>

          {/* Live cost breakdown */}
          <div className="rounded-xl border-2 border-brand-yellow/40 p-4 bg-brand-yellow/5 space-y-1.5 text-sm">
            <div className="font-bold text-base mb-2">Cost Breakup</div>
            <div className="flex justify-between"><span className="text-muted-foreground">{safeQty} cans × ₹{PER_CAN_RATE}/can</span><span>₹{cansCost}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Delivery (₹{perKmRate}/km)</span><span>Calculated at booking</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold"><span>Subtotal (excl. delivery)</span><span className="text-brand-red">₹{cansCost}</span></div>
            <p className="text-[11px] text-muted-foreground mt-1">Minimum {MIN_CANS} cans (₹{MIN_CANS * PER_CAN_RATE}) enforced. + ₹{perKmRate}/km delivery + GST. All rates admin-editable.</p>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
            <Button onClick={onNext} disabled={safeQty < MIN_CANS} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Borewell Depth (feet input) — fetches price master for per-rig rates -------------------- */
function BorewellDepthView({ vehicle, depth, setDepth, schedule, setSchedule, onBack, onNext }: any) {
  const [prices, setPrices] = useState<PriceMaster[]>([]);
  const [rigs, setRigs] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(() => !!vehicle?.serviceId);

  // Default per-rig rates (admin can override via Price Master slabJson)
  // 4"=₹98/ft, 6"=₹120/ft, 8"=₹150/ft
  const DEFAULT_RIG_RATES: Record<string, { first100: number; after100: number }> = {
    "borewell-rig-4-inch": { first100: 98, after100: 110 },
    "borewell-rig-6-inch": { first100: 120, after100: 135 },
    "borewell-rig-8-inch": { first100: 150, after100: 170 },
    "borewell-flush": { first100: 25, after100: 25 },
  };

  useEffect(() => {
    if (!vehicle?.serviceId) return;
    api.getServiceItems(vehicle.serviceId).then((d) => {
      setPrices(d.prices || []);
      setRigs((d.vehicles || []).filter((v: Vehicle) => String(v.slug || "").startsWith("borewell-rig") || v.slug === "borewell-flush"));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [vehicle?.serviceId]);

  // Parse per-foot rate from a price's slabJson: "0-100 ft: 98 per ft, 101+ ft: 110 per ft"
  const parseRigRates = (p?: PriceMaster, fallbackSlug?: string) => {
    const fallback = DEFAULT_RIG_RATES[fallbackSlug || ""] || { first100: 98, after100: 110 };
    if (!p) return fallback;
    const slab = p.slabJson || "";
    const firstMatch = slab.match(/0-100\s*ft:\s*(\d+)\s*per\s*ft/i);
    const afterMatch = slab.match(/101\+\s*ft:\s*(\d+)\s*per\s*ft/i);
    return {
      first100: firstMatch ? Number(firstMatch[1]) : (p.perUnitRate || fallback.first100),
      after100: afterMatch ? Number(afterMatch[1]) : fallback.after100,
    };
  };

  // Rate for the currently selected rig
  const selectedPrice = prices.find((p) => p.vehicleId === vehicle.id);
  const selectedRates = parseRigRates(selectedPrice, vehicle.slug || undefined);
  const perFtRate1 = selectedRates.first100;
  const perFtRate2 = selectedRates.after100;
  const first100 = Math.min(depth, 100) * perFtRate1;
  const after100 = Math.max(0, depth - 100) * perFtRate2;
  const drillingCost = first100 + after100;
  const baseMobilization = selectedPrice?.minimumFare || 0;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-brand-red" /> Drilling Depth — {vehicle.name}</CardTitle>
          <CardDescription>Enter how deep you need to drill. Price is calculated per foot from the Price Master.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Drilling depth (feet)</Label>
            <Input type="number" min="10" step="5" value={depth} onChange={(e) => setDepth(Math.max(10, Number(e.target.value)))} />
            <div className="flex gap-2 mt-2">
              {[50, 100, 150, 200, 300].map((d) => (
                <button key={d} onClick={() => setDepth(d)} className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${depth === d ? "border-brand-yellow bg-brand-yellow/10" : "border-border"}`}>
                  {d} ft
                </button>
              ))}
            </div>
          </div>

          {/* Per-rig rates table (fetched from Price Master) */}
          <div className="rounded-xl border-2 border-border p-3 bg-muted/30">
            <div className="font-bold text-xs mb-2 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Per-Rig Rates (per foot)</div>
            {loading ? <div className="text-xs text-muted-foreground py-1"><Loader2 className="w-3 h-3 inline mr-1 animate-spin" /> Loading rates…</div> : (
              <div className="grid grid-cols-1 gap-1 text-xs">
                {rigs.length === 0 ? (
                  <div className="text-muted-foreground">No rig rates configured.</div>
                ) : rigs.map((r) => {
                  const rp = prices.find((p) => p.vehicleId === r.id);
                  const rr = parseRigRates(rp, r.slug || undefined);
                  const isSel = r.id === vehicle.id;
                  return (
                    <div key={r.id} className={`flex justify-between items-center px-2 py-1 rounded ${isSel ? "bg-brand-yellow/30 font-bold" : ""}`}>
                      <span>{r.name}</span>
                      <span className="text-brand-red">₹{rr.first100}/ft{rr.after100 !== rr.first100 ? ` (then ₹${rr.after100})` : ""}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">First 100 ft rate shown. All rates admin-editable via Price Master.</p>
          </div>

          {/* Live per-foot price breakdown for the selected rig */}
          <div className="rounded-xl border-2 border-brand-yellow/40 p-4 bg-brand-yellow/5 space-y-1.5 text-sm">
            <div className="font-bold text-base mb-2">Live Price Breakup — {vehicle.name}</div>
            {baseMobilization > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Base mobilization</span><span>₹{baseMobilization}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">First 100 ft × ₹{perFtRate1}/ft</span><span>₹{first100}</span></div>
            {depth > 100 && <div className="flex justify-between"><span className="text-muted-foreground">After 100 ft ({depth - 100} ft) × ₹{perFtRate2}/ft</span><span>₹{after100}</span></div>}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold"><span>Drilling Cost</span><span className="text-brand-red">₹{baseMobilization + drillingCost}</span></div>
            <p className="text-[11px] text-muted-foreground mt-1">+ transport (calculated at booking) + GST. All rates admin-editable.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><Label htmlFor="date">Date</Label><Input id="date" type="date" value={schedule.date} onChange={(e) => setSchedule({ ...schedule, date: e.target.value })} /></div>
            <div><Label htmlFor="time">Time</Label><Input id="time" type="time" value={schedule.time} onChange={(e) => setSchedule({ ...schedule, time: e.target.value })} /></div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
            <Button onClick={onNext} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Trip Type (Outstation) -------------------- */
function TripTypeView({ service, tripType, setTripType, schedule, setSchedule, distanceKm, etaText, onBack, onNext }: any) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Stepper step={2} done={1} />
      <Card className="mt-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-brand-red" /> Trip Type — {service.name}</CardTitle>
          <CardDescription>{distanceKm} km · ETA {etaText || "—"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setTripType("One-Way")} className={`text-left rounded-xl border-2 p-4 transition-all ${tripType === "One-Way" ? "border-brand-yellow bg-brand-yellow/10" : "border-border hover:border-brand-yellow/50"}`}>
              <div className="font-bold">One-Way</div>
              <div className="text-xs text-muted-foreground">Drop only · standard rate</div>
            </button>
            <button onClick={() => setTripType("Round-Trip")} className={`text-left rounded-xl border-2 p-4 transition-all ${tripType === "Round-Trip" ? "border-brand-yellow bg-brand-yellow/10" : "border-border hover:border-brand-yellow/50"}`}>
              <div className="font-bold">Round-Trip</div>
              <div className="text-xs text-muted-foreground">Return included · 1.8× rate (admin-configurable)</div>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label htmlFor="date">Travel date</Label><Input id="date" type="date" value={schedule.date} onChange={(e) => setSchedule({ ...schedule, date: e.target.value })} /></div>
            <div><Label htmlFor="time">Time</Label><Input id="time" type="time" value={schedule.time} onChange={(e) => setSchedule({ ...schedule, time: e.target.value })} /></div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
            <Button onClick={onNext} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">Show Vehicle Prices <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Shop List (Supplier/Shop directory — pick a shop type) -------------------- */
function ShopListView({ service, onSelectShop, onBack }: any) {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFoodDelivery = service?.slug === "food-delivery";
  const shopType = isFoodDelivery ? "restaurant" : "shop";
  const userPincode = typeof window !== "undefined" ? localStorage.getItem("pm_pincode") || undefined : undefined;

  useEffect(() => {
    api.publicShops(shopType, userPincode).then((d) => setShops(d.shops || [])).catch(() => {}).finally(() => setLoading(false));
  }, [shopType, userPincode]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* BIG back button */}
      <Button variant="outline" size="lg" className="mb-4 h-12 text-base font-bold" onClick={onBack}>
        <ChevronLeft className="w-5 h-5 mr-1" /> Back to Home
      </Button>
      <div className="mb-4">
        <h2 className="text-2xl font-extrabold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-brand-red" /> {isFoodDelivery ? "Select a Restaurant" : "Select a Shop"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{isFoodDelivery ? "Choose a restaurant to browse food items" : "Choose a shop type to browse products"}</p>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-yellow" /></div>
      ) : shops.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No shops available yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {shops.map((shop) => (
            <button
              key={shop.id}
              onClick={() => onSelectShop(shop.id)}
              className="text-left rounded-2xl border-2 border-border overflow-hidden hover:border-brand-yellow hover:shadow-lg hover:-translate-y-0.5 transition-all bg-card flex flex-col"
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {shop.shopPhotoUrl ? (
                  <img src={shop.shopPhotoUrl} alt={shop.shopName} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-yellow/20"><ShoppingCart className="w-10 h-10 text-brand-black/40" /></div>
                )}
                <span className="absolute top-2 right-2 bg-brand-yellow text-brand-black text-[10px] font-bold px-2 py-0.5 rounded-full">{shop._count?.products || 0} items</span>
              </div>
              <div className="bg-gradient-to-r from-brand-red to-brand-yellow px-3 py-2">
                <div className="font-extrabold text-sm text-white leading-tight">{shop.shopName}</div>
              </div>
              <div className="p-2.5 flex-1 flex flex-col">
                <div className="text-[10px] text-muted-foreground">{shop.supplierType}</div>
                {shop.flatDeliveryFee > 0 && <div className="text-[10px] text-green-700 font-semibold mt-1">Delivery: ₹{shop.flatDeliveryFee}</div>}
                <div className="mt-1.5 text-xs font-bold text-brand-red flex items-center gap-1">
                  Browse Products <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------- Shop Products (grocery catalog with search + categories + cart) -------------------- */
function ShopProductsView({ service, shopId, onBack, onCheckout }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const cart = useCart();
  const userPincode = typeof window !== "undefined" ? localStorage.getItem("pm_pincode") || undefined : undefined;

  useEffect(() => {
    api.getProducts(userPincode).then((d) => {
      let all = d.products || [];
      if (shopId) {
        // Filter by shop/supplier
        all = all.filter((p: any) => p.supplierId === shopId);
      } else if (service?.slug === "grocery-ration") {
        // Grocery items only
        const GROCERY_CATS = ["Atta & Flour","Dairy","Dal & Pulses","Fruits","Grocery Staples","Masala & Spices","Oils & Ghee","Rice & Grains","Snacks","Spices","Sugar & Salt","Tea & Coffee","Vegetables","Vegetables & Fruits","Oil/Dairy/Bakery","Atta & Flours","Pulses & Lentils","Oils & Ghee","Sugar & Salt","Tea & Coffee","Spices & Masala","Biscuits & Snacks","Cleaning","Personal Care","Beverages","Rice & Grains"];
        all = all.filter((p: any) => GROCERY_CATS.includes(p.category));
      }
      setProducts(all);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [service?.slug, shopId, userPincode]);

  // Build category list (All + unique categories, sorted)
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => { if (p.category) set.add(p.category); });
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  // Filter products by search + category
  const filtered = products.filter((p) => {
    if (activeCat !== "All" && p.category !== activeCat) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.productName?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Button variant="outline" size="lg" className="mb-3 h-12 text-base font-bold" onClick={onBack}>
        <ChevronLeft className="w-5 h-5 mr-1" /> {service?.slug === "supplier-shop" ? "Back to Shops" : "Back to Home"}
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-brand-red" /> {service.name}</CardTitle>
          <CardDescription>Browse grocery & ration products from verified suppliers. Add to cart and checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products, brands, categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pm-scroll pb-2 -mx-1 px-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${activeCat === c ? "border-brand-yellow bg-brand-yellow text-brand-black" : "border-border hover:border-brand-yellow/50"}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Product grid */}
          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No products found. Try a different search or category.</p>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((p) => {
                  const discount = p.mrp && p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;
                  return (
                    <div key={p.id} className="rounded-2xl border-2 border-border overflow-hidden hover:border-brand-yellow hover:shadow-lg transition-all flex flex-col bg-card">
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.productName} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand-yellow/20"><Package className="w-8 h-8 text-brand-black/40" /></div>
                        )}
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{discount}% OFF</span>
                        )}
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col">
                        <div className="font-semibold text-xs leading-tight line-clamp-2 min-h-[2rem]">{p.productName}</div>
                        {p.brand && <div className="text-[10px] text-muted-foreground mt-0.5">{p.brand}</div>}
                        {p.packSize && <div className="text-[10px] text-muted-foreground">{p.packSize}</div>}
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="font-bold text-brand-red text-sm flex items-center"><IndianRupee className="w-3 h-3" />{p.sellingPrice}</span>
                          {p.mrp && p.mrp > p.sellingPrice && <span className="text-[10px] text-muted-foreground line-through">₹{p.mrp}</span>}
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold h-8 text-xs"
                          disabled={p.stock <= 0}
                          onClick={() => {
                            cart.addItem({
                              id: `product-${p.id}`,
                              name: p.productName,
                              price: p.sellingPrice,
                              image: p.photoUrl || undefined,
                              unit: p.packSize || undefined,
                              serviceSlug: "supplier-shop",
                            });
                            toast.success(`${p.productName} added to cart`);
                          }}
                        >
                          {p.stock <= 0 ? "Out of Stock" : <><Plus className="w-3 h-3 mr-1" /> Add to Cart</>}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Sticky checkout bar */}
          {cart.count > 0 && (
            <div className="sticky bottom-3 z-10 mt-4">
              <div className="rounded-xl bg-brand-black text-white p-3 flex items-center justify-between shadow-2xl border-2 border-brand-yellow">
                <div className="text-sm">
                  <span className="font-bold text-brand-yellow">{cart.count} item{cart.count !== 1 ? "s" : ""}</span>
                  <span className="ml-2 text-white/80">Total: <span className="font-bold">₹{cart.total}</span></span>
                </div>
                <Button onClick={onCheckout} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold h-9">
                  Checkout <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Item Type Select (Material/Machinery/Water) -------------------- */
function ItemTypeSelectView({ service, title, onSelect, onBack }: any) {
  const [items, setItems] = useState<{ vehicles: Vehicle[]; prices: PriceMaster[] }>({ vehicles: [], prices: [] });
  const [loading, setLoading] = useState(true);
  const cart = useCart();
  useEffect(() => {
    api.getServiceItems(service.id).then((d) => { setItems({ vehicles: d.vehicles || [], prices: d.prices || [] }); }).catch(() => {}).finally(() => setLoading(false));
  }, [service.id]);
  const isShop = service.slug === "supplier-shop";
  const getPriceForVehicle = (vid: number) => items.prices.find((p) => p.vehicleId === vid);
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-brand-red" /> {title} — {service.name}</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> :
            items.vehicles.length === 0 ? <p className="text-muted-foreground text-center py-8">No items available.</p> : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {items.vehicles.map((v: Vehicle) => {
                  const price = getPriceForVehicle(v.id);
                  return (
                  <div key={v.id} className="rounded-2xl border-2 border-border overflow-hidden hover:border-brand-yellow hover:shadow-lg transition-all flex flex-col">
                    <button onClick={() => onSelect(v)} className="text-left flex-1">
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {v.imageUrl ? <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center bg-brand-yellow"><Package className="w-10 h-10 text-brand-black" /></div>}
                      </div>
                      <div className="p-3">
                        <div className="font-bold text-sm">{v.name}</div>
                        {v.maxLoad && <div className="text-xs text-muted-foreground">{v.maxLoad}</div>}
                        {v.recommendedUse && <div className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{v.recommendedUse}</div>}
                        {isShop && price && <div className="font-bold text-brand-red text-sm mt-1">₹{price.minimumFare} <span className="text-[10px] text-muted-foreground font-normal">+ delivery</span></div>}
                      </div>
                    </button>
                    {/* Add to Cart button for shop products */}
                    {isShop && price && (
                      <div className="p-2 pt-0">
                        <Button size="sm" className="w-full bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold h-9 text-xs" onClick={(e) => {
                          e.stopPropagation();
                          cart.addItem({
                            id: `shop-${v.id}`,
                            name: v.name,
                            price: price.minimumFare,
                            image: v.imageUrl || undefined,
                            unit: v.maxLoad || undefined,
                            serviceSlug: "supplier-shop",
                            vehicleId: v.id,
                            priceId: price.id,
                          });
                          toast.success(`${v.name} added to cart`);
                        }}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add to Cart
                        </Button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Material Quantity -------------------- */
function MaterialQuantityView({ vehicle, quantity, setQuantity, onBack, onNext }: any) {
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Card>
        <CardHeader><CardTitle>Quantity — {vehicle.name}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Enter the required quantity. Unit type is configured by admin per material.</p>
          <div>
            <Label>Quantity</Label>
            <Input type="number" min="1" step="0.5" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
          </div>
          {vehicle.recommendedUse && <p className="text-xs text-muted-foreground">Use: {vehicle.recommendedUse}</p>}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
            <Button onClick={onNext} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Single Location (Material/Machinery/Water) -------------------- */
function SingleLocationView({ service, title, drop, onOpenPicker, onBack, onNext, loading }: any) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Stepper step={2} done={1} />
      <Card className="mt-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-red" /> {title} — {service.name}</CardTitle>
          <CardDescription>Tap to open the map picker and set the exact location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border-2 border-brand-red/40 p-4 bg-brand-red/5">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-bold flex items-center gap-1"><MapPin className="w-4 h-4 text-brand-red" /> Location</Label>
              <Button size="sm" className="bg-brand-red text-white hover:bg-brand-red/90" onClick={onOpenPicker}><MapPin className="w-3 h-3 mr-1" /> Select Location</Button>
            </div>
            <Input placeholder="Address (auto-filled from map)" value={drop.address} readOnly />
            {drop.lat != null && <div className="text-[11px] text-muted-foreground mt-1 font-mono">Lat: {drop.lat.toFixed(5)}, Lng: {drop.lng?.toFixed(5)} {drop.mapLink && <a href={drop.mapLink} target="_blank" className="text-brand-red underline ml-2">Map ↗</a>}</div>}
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
            <Button onClick={onNext} disabled={loading || !drop.lat} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              {loading ? "Loading..." : "Show Prices"} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Material Shops (sorted by landed price) -------------------- */
function MaterialShopsView({ cards, bestPriceId, selected, onSelect, onBack }: any) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Stepper step={2} done={1} />
      <Card className="mt-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-brand-red" /> Shops sorted by final landed price</CardTitle>
          <CardDescription>Material cost + delivery charge + GST. Best price highlighted.</CardDescription>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? <p className="text-muted-foreground text-center py-8">No shops available for this material.</p> : (
            <div className="space-y-3">
              {cards.map((c: MaterialShopCard, i: number) => {
                const isBest = c.priceId === bestPriceId;
                const isSel = selected?.priceId === c.priceId;
                return (
                  <button key={c.priceId} onClick={() => onSelect(c)}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${isSel ? "border-brand-yellow ring-2 ring-brand-yellow" : isBest ? "border-green-500 bg-green-50" : "border-border hover:border-brand-yellow/50"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{c.shop.name}</span>
                          {isBest && <Badge className="bg-green-600 text-white text-[10px]">★ Best Price</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{c.shop.address}</div>
                        <div className="text-xs mt-1">{c.material.name}: ₹{c.material.perUnitRate}/{c.material.unitType} × {c.quantity} {c.material.unitType}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          Material ₹{c.materialCost} · Delivery ₹{c.deliveryCharge}{c.distanceKm != null && ` (${c.distanceKm} km)`} · GST ₹{c.gst}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-extrabold text-brand-red">₹{c.finalLandedPrice}</div>
                        {c.advanceAmount > 0 && <div className="text-[10px] text-muted-foreground">Advance ₹{c.advanceAmount}</div>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Machinery Duration -------------------- */
function MachineryDurationView({ vehicle, durationHours, setDurationHours, durationDays, setDurationDays, schedule, setSchedule, onBack, onNext }: any) {
  const [mode, setMode] = useState<"hours" | "days">("hours");
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <Card>
        <CardHeader><CardTitle>Rental Duration — {vehicle.name}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Select how long you need the machine. Final price = rate × duration.</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode("hours")} className={`rounded-lg border-2 p-2 text-sm font-medium ${mode === "hours" ? "border-brand-yellow bg-brand-yellow/10" : "border-border"}`}>By Hours</button>
            <button onClick={() => setMode("days")} className={`rounded-lg border-2 p-2 text-sm font-medium ${mode === "days" ? "border-brand-yellow bg-brand-yellow/10" : "border-border"}`}>By Days</button>
          </div>
          {mode === "hours" ? (
            <div><Label>Number of hours</Label><Input type="number" min="1" value={durationHours} onChange={(e) => setDurationHours(Math.max(1, Number(e.target.value)))} /></div>
          ) : (
            <div><Label>Number of days</Label><Input type="number" min="1" value={durationDays} onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))} /></div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div><Label htmlFor="date">Date</Label><Input id="date" type="date" value={schedule.date} onChange={(e) => setSchedule({ ...schedule, date: e.target.value })} /></div>
            <div><Label htmlFor="time">Time</Label><Input id="time" type="time" value={schedule.time} onChange={(e) => setSchedule({ ...schedule, time: e.target.value })} /></div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
            <Button onClick={onNext} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Stepper -------------------- */
function Stepper({ step, done = 0 }: { step: number; done?: number }) {
  const steps = ["Service", "Location", "Vehicle", "Details", "Payment"];
  return (
    <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs overflow-x-auto pm-scroll pb-1">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === step;
        const isDone = n <= done;
        return (
          <div key={s} className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[9px] sm:text-[11px] ${isDone ? "bg-green-600 text-white" : active ? "bg-brand-yellow text-brand-black" : "bg-muted text-muted-foreground"}`}>
              {isDone ? "✓" : n}
            </div>
            <span className={`${active ? "font-bold" : "text-muted-foreground"} hidden xs:inline sm:inline`}>{s}</span>
            {i < steps.length - 1 && <div className="w-2 sm:w-4 h-px bg-border mx-0.5 sm:mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- Footer -------------------- */
function CustomerFooter({ settings, waLink, onPolicies, onOpenAdmin }: any) {
  return (
    <footer className="mt-auto bg-brand-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 grid md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <img src="/logo.png" alt="ParcelMaadi" className="w-12 h-12 rounded-lg object-contain" style={{ background: "transparent" }} />
            <div>
              <div className="font-extrabold text-lg"><span className="text-brand-red">Parcel</span><span className="text-brand-yellow">Maadi</span></div>
              <div className="text-[10px] text-white/70">{settings.tagline || "Fast Local Reliable"}</div>
            </div>
          </div>
          <p className="text-sm text-white/70 max-w-md">Your local partner for parcel, courier, goods vehicles, water tankers, construction material and machinery rental across Karnataka.</p>
          {settings.company_address && <p className="text-xs text-white/50 mt-2 max-w-md">{settings.company_address}</p>}
          <p className="text-xs text-white/50 mt-1">🌐 {settings.website || "parcelmaadi.com"}</p>
        </div>
        <div>
          <h4 className="font-bold text-brand-yellow mb-2">Contact</h4>
          <ul className="text-sm space-y-1 text-white/80">
            {settings.ceo_name && <li className="text-xs text-white/60">CEO: {settings.ceo_name} · <a href={`tel:${settings.ceo_mobile}`} className="hover:text-brand-yellow">{settings.ceo_mobile}</a></li>}
            {settings.md_name && <li className="text-xs text-white/60">MD: {settings.md_name} · <a href={`tel:${settings.md_mobile}`} className="hover:text-brand-yellow">{settings.md_mobile}</a></li>}
            <li><a href={`tel:${settings.contact_1}`} className="hover:text-brand-yellow inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {settings.contact_1 || "9741433725"}</a></li>
            <li><a href={`mailto:${settings.email}`} className="hover:text-brand-yellow">{settings.email || "parcelmaadipm@gmail.com"}</a></li>
            <li><a href={waLink("Hello ParcelMaadi!")} target="_blank" className="hover:text-brand-yellow inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-brand-yellow mb-2">Quick Links</h4>
          <ul className="text-sm space-y-1.5 text-white/80">
            <li><button onClick={onPolicies} className="hover:text-brand-yellow">Terms & Conditions</button></li>
            <li><button onClick={onPolicies} className="hover:text-brand-yellow">Privacy Policy</button></li>
            <li><button onClick={onPolicies} className="hover:text-brand-yellow">Refund Policy</button></li>
            <li><button onClick={onOpenAdmin} className="hover:text-brand-yellow">Admin</button></li>
            <li><a href={`https://${settings.website || "parcelmaadi.com"}`} className="hover:text-brand-yellow">{settings.website || "parcelmaadi.com"}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-3 text-center text-xs text-white/50">© {new Date().getFullYear()} ParcelMaadi · Operated by HP Enterprise (GSTIN {settings.gstin || "29ANZPH4067Q1ZS"}) · Made for Karnataka 🇮🇳</div>
    </footer>
  );
}
