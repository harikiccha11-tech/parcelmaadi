import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/salary-payments/{id} — update salary status (Approve/Pay)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ["basicSalary", "hra", "conveyance", "specialAllowance", "bonus", "deductions",
      "pfDeduction", "esiDeduction", "taxDeduction", "daysPresent", "daysAbsent", "daysInMonth",
      "status", "paidAt", "utr", "notes"];

    const data: any = {};
    for (const k of allowed) {
      if (k in body) {
        if (["basicSalary", "hra", "conveyance", "specialAllowance", "bonus", "deductions",
          "pfDeduction", "esiDeduction", "taxDeduction"].includes(k)) {
          data[k] = Number(body[k]) || 0;
        } else if (k === "paidAt" && body[k]) {
          data[k] = new Date(body[k]);
        } else {
          data[k] = body[k];
        }
      }
    }

    // Recalculate netAmount if components changed
    if (Object.keys(data).some(k => ["basicSalary", "hra", "conveyance", "specialAllowance", "bonus", "deductions", "pfDeduction", "esiDeduction", "taxDeduction"].includes(k))) {
      const existing = await db.salaryPayment.findUnique({ where: { id: Number(id) } });
      if (existing) {
        const gross = (data.basicSalary ?? existing.basicSalary) + (data.hra ?? existing.hra) +
          (data.conveyance ?? existing.conveyance) + (data.specialAllowance ?? existing.specialAllowance) +
          (data.bonus ?? existing.bonus);
        const totalDeductions = (data.deductions ?? existing.deductions) + (data.pfDeduction ?? existing.pfDeduction) +
          (data.esiDeduction ?? existing.esiDeduction) + (data.taxDeduction ?? existing.taxDeduction);
        data.netAmount = gross - totalDeductions;
      }
    }

    // If status is "Paid" and no paidAt, set it
    if (data.status === "Paid" && !data.paidAt) {
      data.paidAt = new Date();
    }

    const item = await db.salaryPayment.update({ where: { id: Number(id) }, data });
    return NextResponse.json({ item, ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 500 });
  }
}

// DELETE /api/admin/salary-payments/{id}
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { id } = await params;
    await db.salaryPayment.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 500 });
  }
}
