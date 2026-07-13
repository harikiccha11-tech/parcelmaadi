import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/staff/{id} — update staff details
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();

    // Allowed fields for update
    const allowed = [
      "name", "email", "mobile", "role", "status",
      "employeeId", "designation", "department", "branch", "reportingTo",
      "joiningDate", "dateOfBirth", "gender", "bloodGroup", "address", "city", "pincode",
      "aadhaar", "pan", "bankName", "bankAccount", "bankIfsc", "upiId",
      "emergencyContact", "emergencyName",
      "basicSalary", "hraAllowance", "conveyanceAllowance", "specialAllowance",
      "pfNumber", "esiNumber", "shiftTiming", "profilePhotoUrl", "archived",
      "forcePasswordChange",
    ];

    const data: any = {};
    for (const k of allowed) {
      if (k in body) {
        if (["basicSalary", "hraAllowance", "conveyanceAllowance", "specialAllowance"].includes(k)) {
          data[k] = Number(body[k]) || 0;
        } else if (["joiningDate", "dateOfBirth"].includes(k) && body[k]) {
          data[k] = new Date(body[k]);
        } else {
          data[k] = body[k];
        }
      }
    }

    // If email is changing, check uniqueness
    if (data.email) {
      const existing = await db.adminUser.findUnique({ where: { email: data.email } }).catch(() => null);
      if (existing && existing.id !== Number(id)) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    // If employeeId is changing, check uniqueness
    if (data.employeeId) {
      const existingEmp = await db.adminUser.findUnique({ where: { employeeId: data.employeeId } }).catch(() => null);
      if (existingEmp && existingEmp.id !== Number(id)) {
        return NextResponse.json({ error: "Employee ID already in use" }, { status: 400 });
      }
    }

    const item = await db.adminUser.update({
      where: { id: Number(id) },
      data,
      select: {
        id: true, name: true, email: true, mobile: true, role: true, status: true,
        employeeId: true, designation: true, department: true, branch: true,
        joiningDate: true, basicSalary: true, hraAllowance: true, conveyanceAllowance: true,
        specialAllowance: true, archived: true, forcePasswordChange: true,
      },
    });

    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 500 });
  }
}

// DELETE /api/admin/staff/{id} — archive (soft delete) — never hard delete employee records
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { id } = await params;

    // Prevent self-deletion
    if (Number(id) === auth.admin.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Prevent deletion of Owner role
    const staff = await db.adminUser.findUnique({ where: { id: Number(id) } });
    if (staff?.role === "Owner") {
      return NextResponse.json({ error: "Cannot delete Owner account" }, { status: 400 });
    }

    // Soft delete: mark as archived + status Inactive
    await db.adminUser.update({
      where: { id: Number(id) },
      data: { archived: true, status: "Inactive" },
    });
    return NextResponse.json({ ok: true, archived: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 500 });
  }
}
