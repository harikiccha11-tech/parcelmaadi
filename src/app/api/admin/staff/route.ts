import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { parseListParams, paginatedResponse } from "@/lib/list-utils";

// GET /api/admin/staff — list all staff/employees (paginated)
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { where, page, limit, skip, take, sortBy, sortOrder } = parseListParams(req, {
      searchFields: ["name", "email", "mobile", "employeeId", "designation", "department"],
      filterFields: ["status", "role", "department"],
      hasArchived: true,
      defaultSortBy: "id",
    });

    const [items, total] = await Promise.all([
      db.adminUser.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true, name: true, email: true, mobile: true, role: true, status: true,
          employeeId: true, designation: true, department: true, branch: true,
          joiningDate: true, basicSalary: true, hraAllowance: true, conveyanceAllowance: true,
          specialAllowance: true, archived: true, profilePhotoUrl: true, shiftTiming: true,
          reportingTo: true, createdAt: true, forcePasswordChange: true,
        },
      }),
      db.adminUser.count({ where }),
    ]);

    // Compute total monthly salary per staff
    const itemsWithSalary = items.map((s) => ({
      ...s,
      totalSalary: s.basicSalary + s.hraAllowance + s.conveyanceAllowance + s.specialAllowance,
    }));

    return NextResponse.json(paginatedResponse(itemsWithSalary, total, page, limit));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch staff" }, { status: 500 });
  }
}

// POST /api/admin/staff — create new staff/employee with login credentials
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const body = await req.json();
    const {
      name, email, mobile, password, role, status,
      employeeId, designation, department, branch, reportingTo,
      joiningDate, dateOfBirth, gender, bloodGroup, address, city, pincode,
      aadhaar, pan, bankName, bankAccount, bankIfsc, upiId,
      emergencyContact, emergencyName,
      basicSalary, hraAllowance, conveyanceAllowance, specialAllowance,
      pfNumber, esiNumber, shiftTiming, profilePhotoUrl,
    } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email, password required" }, { status: 400 });
    }

    // Check email uniqueness
    const existing = await db.adminUser.findUnique({ where: { email } }).catch(() => null);
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

    // Check employeeId uniqueness if provided
    if (employeeId) {
      const existingEmp = await db.adminUser.findUnique({ where: { employeeId } }).catch(() => null);
      if (existingEmp) return NextResponse.json({ error: "Employee ID already exists" }, { status: 400 });
    }

    const newStaff = await db.adminUser.create({
      data: {
        name, email, mobile,
        passwordHash: hashPassword(password),
        role: role || "Staff",
        status: status || "Active",
        forcePasswordChange: true, // Force password change on first login
        employeeId,
        designation,
        department,
        branch,
        reportingTo,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        bloodGroup,
        address,
        city,
        pincode,
        aadhaar,
        pan,
        bankName,
        bankAccount,
        bankIfsc,
        upiId,
        emergencyContact,
        emergencyName,
        basicSalary: Number(basicSalary) || 0,
        hraAllowance: Number(hraAllowance) || 0,
        conveyanceAllowance: Number(conveyanceAllowance) || 0,
        specialAllowance: Number(specialAllowance) || 0,
        pfNumber,
        esiNumber,
        shiftTiming,
        profilePhotoUrl,
      },
      select: { id: true, name: true, email: true, employeeId: true, designation: true, role: true, status: true },
    });

    return NextResponse.json({ item: newStaff, ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}
