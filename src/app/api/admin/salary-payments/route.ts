import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseListParams, paginatedResponse } from "@/lib/list-utils";

// GET /api/admin/salary-payments — list salary payments
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");
    const staffId = url.searchParams.get("staffId");

    const { where, page, limit, skip, take, sortBy, sortOrder } = parseListParams(req, {
      filterFields: ["status"],
      hasArchived: false,
      defaultSortBy: "id",
    });

    if (month) where.month = Number(month);
    if (year) where.year = Number(year);
    if (staffId) where.staffId = Number(staffId);

    const [items, total] = await Promise.all([
      db.salaryPayment.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        include: { staff: { select: { id: true, name: true, email: true, employeeId: true, designation: true, department: true } } },
      }),
      db.salaryPayment.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(items, total, page, limit));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// POST /api/admin/salary-payments — create or auto-generate monthly salary for a staff
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const body = await req.json();
    const {
      staffId, month, year,
      basicSalary, hra, conveyance, specialAllowance, bonus, deductions,
      pfDeduction, esiDeduction, taxDeduction,
      daysPresent, daysAbsent, daysInMonth,
      status, notes,
    } = body || {};

    if (!staffId || !month || !year) {
      return NextResponse.json({ error: "staffId, month, year required" }, { status: 400 });
    }

    // Check staff exists
    const staff = await db.adminUser.findUnique({ where: { id: Number(staffId) } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    // Auto-fill from staff profile if not provided
    const basic = Number(basicSalary) || staff.basicSalary;
    const hraAmt = Number(hra) || staff.hraAllowance;
    const convAmt = Number(conveyance) || staff.conveyanceAllowance;
    const specAmt = Number(specialAllowance) || staff.specialAllowance;
    const bonusAmt = Number(bonus) || 0;
    const deduct = Number(deductions) || 0;
    const pf = Number(pfDeduction) || 0;
    const esi = Number(esiDeduction) || 0;
    const tax = Number(taxDeduction) || 0;

    // Net = (basic + hra + conveyance + special + bonus) - (deductions + pf + esi + tax)
    const gross = basic + hraAmt + convAmt + specAmt + bonusAmt;
    const totalDeductions = deduct + pf + esi + tax;
    const net = gross - totalDeductions;

    // Use upsert — one salary record per staff per month
    const item = await db.salaryPayment.upsert({
      where: { staffId_month_year: { staffId: Number(staffId), month: Number(month), year: Number(year) } },
      create: {
        staffId: Number(staffId),
        month: Number(month),
        year: Number(year),
        basicSalary: basic,
        hra: hraAmt,
        conveyance: convAmt,
        specialAllowance: specAmt,
        bonus: bonusAmt,
        deductions: deduct,
        pfDeduction: pf,
        esiDeduction: esi,
        taxDeduction: tax,
        netAmount: net,
        daysPresent: Number(daysPresent) || 0,
        daysAbsent: Number(daysAbsent) || 0,
        daysInMonth: Number(daysInMonth) || 30,
        status: status || "Pending",
        notes,
      },
      update: {
        basicSalary: basic,
        hra: hraAmt,
        conveyance: convAmt,
        specialAllowance: specAmt,
        bonus: bonusAmt,
        deductions: deduct,
        pfDeduction: pf,
        esiDeduction: esi,
        taxDeduction: tax,
        netAmount: net,
        daysPresent: Number(daysPresent) || 0,
        daysAbsent: Number(daysAbsent) || 0,
        daysInMonth: Number(daysInMonth) || 30,
        status: status || "Pending",
        notes,
      },
      include: { staff: { select: { name: true, employeeId: true, designation: true } } },
    });

    return NextResponse.json({ item, ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}
