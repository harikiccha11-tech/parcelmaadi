import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/wallets/transactions — list wallet transactions
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const url = new URL(req.url);
    const walletId = url.searchParams.get("walletId");
    const limit = Number(url.searchParams.get("limit") || 100);

    const where: any = {};
    if (walletId) where.walletId = Number(walletId);

    const items = await db.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { wallet: true },
    });
    return NextResponse.json({ items, count: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// POST /api/admin/wallets/transactions — credit/debit
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { walletId, type, amount, description, reference } = await req.json();
    if (!walletId || !type || !amount) {
      return NextResponse.json({ error: "walletId, type, amount required" }, { status: 400 });
    }
    const wallet = await db.wallet.findUnique({ where: { id: Number(walletId) } });
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

    const newBalance = type === "Credit" ? wallet.balance + Number(amount) : wallet.balance - Number(amount);
    if (newBalance < 0) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    const [updated, tx] = await db.$transaction([
      db.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } }),
      db.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount: Number(amount),
          description,
          reference,
          balanceAfter: newBalance,
        },
      }),
    ]);
    return NextResponse.json({ tx, wallet: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
