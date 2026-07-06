"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { api, type Booking, type PriceMaster, type Service, type Vehicle, type Supplier, type Product, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, SERVICE_STATUS_OPTIONS, ADMIN_ROLES } from "@/lib/api";
import { ServiceIcon } from "@/components/service-icon";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  LayoutDashboard, BookOpen, IndianRupee, Boxes, Truck, Users, Package,
  Settings as SettingsIcon, Globe, LogOut, Loader2, Search, Menu, X,
  Phone, MessageCircle, ChevronRight, ChevronLeft, Plus, Pencil, Trash2, Check, RefreshCw, Lock,
  Download, FileText, Bell, UserCog, ShieldAlert, Image as ImageIcon, Ban, Zap, MapPin, Tag, Upload,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/customer-app";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
// socket.io-client import removed — admin panel now uses polling instead (Vercel-compatible)

interface AdminAppProps {
  onExit: () => void;
}

type Tab = "dashboard" | "bookings" | "price" | "zones" | "coupons" | "reports" | "departments" | "suppliers" | "products" | "apks" | "users" | "activity" | "settings" | "domain" | "system";

const ADMIN_NAV: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "departments", label: "Departments", icon: Boxes },
  { id: "bookings", label: "Bookings", icon: BookOpen },
  { id: "price", label: "Price Master", icon: IndianRupee },
  { id: "zones", label: "Zones", icon: MapPin },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "reports", label: "Reports", icon: Download },
  { id: "suppliers", label: "Suppliers", icon: Users },
  { id: "products", label: "Products", icon: Package },
  { id: "apks", label: "APKs", icon: Smartphone },
  { id: "users", label: "Admin Users", icon: UserCog },
  { id: "activity", label: "Activity Log", icon: Bell },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "system", label: "System Tools", icon: ShieldAlert },
  { id: "domain", label: "Domain", icon: Globe },
];

function SidebarContent({ tab, setTab, onExit, onLogout }: { tab: Tab; setTab: (t: Tab) => void; onExit: () => void; onLogout: () => void; }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <img src="/logo.png" alt="" className="w-8 h-8 rounded bg-white p-1" />
        <div>
          <div className="font-extrabold text-brand-yellow text-sm">ParcelMaadi</div>
          <div className="text-[10px] text-white/60">Admin Panel</div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {ADMIN_NAV.map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === n.id ? "bg-brand-yellow text-brand-black" : "text-white/80 hover:bg-white/10 hover:text-brand-yellow"}`}>
            <n.icon className="w-4 h-4" /> {n.label}
          </button>
        ))}
      </nav>
      <div className="p-2 border-t border-white/10 space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-brand-yellow" onClick={onExit}>
          <X className="w-4 h-4 mr-2" /> Exit to Website
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-red-400" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
}

export function AdminApp({ onExit }: AdminAppProps) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [forcePwChange, setForcePwChange] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveBadge, setLiveBadge] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const mainContentRef = useRef<HTMLElement>(null);

  // CRITICAL: scroll to TOP whenever admin tab changes — prevents showing from bottom
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        mainContentRef.current?.scrollTo(0, 0);
        window.scrollTo(0, 0);
      });
    }
  }, [tab]);

  useEffect(() => {
    api.adminMe().then(() => setAuthed(true)).catch(() => setAuthed(false)).finally(() => setChecking(false));
  }, []);

  // Real-time admin notifications via polling (replaces socket.io for Vercel compatibility)
  // Polls /api/admin/bookings every 15 seconds and detects new bookings by comparing
  // the latest booking ID. Also triggers refresh on status changes.
  useEffect(() => {
    if (!authed) return;
    let lastLatestId: number | null = null;
    let lastCount: number | null = null;

    const poll = async () => {
      try {
        const r = await api.adminBookings();
        const bookings = r.bookings || [];
        if (bookings.length === 0) return;

        const latestId = bookings[0]?.id ?? 0;

        if (lastLatestId !== null && latestId > lastLatestId) {
          // New booking detected
          const newBookings = bookings.filter((b: any) => b.id > lastLatestId!);
          setLiveBadge((b) => b + newBookings.length);
          for (const nb of newBookings) {
            toast.success(`🆕 New booking ${nb.bookingId || ""}`, {
              description: `${nb.service?.name || ""} · ${nb.customer?.name || ""}`,
            });
            try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=").play(); } catch {}
          }
          setRefreshTick((t) => t + 1);
        }

        if (lastCount !== null && lastCount !== bookings.length && lastLatestId === latestId) {
          // Count changed but no new booking — likely a status update
          setRefreshTick((t) => t + 1);
        }

        lastLatestId = latestId;
        lastCount = bookings.length;
      } catch {
        // silent — polling is best-effort
      }
    };

    // Initial poll after 3 seconds (let the page settle)
    const initialTimer = setTimeout(poll, 3000);
    const interval = setInterval(poll, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [authed]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <LoginView onSuccess={() => setAuthed(true)} onForcePwChange={() => { setAuthed(true); setForcePwChange(true); }} onExit={onExit} />;
  }

  if (forcePwChange) {
    return <ForcePasswordChangeView onDone={() => setForcePwChange(false)} onExit={onExit} />;
  }

  const logout = async () => {
    try { await api.adminLogout(); } catch {}
    setAuthed(false);
    onExit();
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="hidden md:flex w-60 bg-brand-black flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent tab={tab} setTab={(t) => setTab(t)} onExit={onExit} onLogout={logout} />
      </aside>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0 bg-brand-black border-0">
          <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
          <SidebarContent tab={tab} setTab={(t) => { setTab(t); setSidebarOpen(false); }} onExit={onExit} onLogout={logout} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 md:ml-60 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b h-14 flex items-center gap-3 px-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg capitalize">{ADMIN_NAV.find((n) => n.id === tab)?.label}</h1>
          <div className="ml-auto flex items-center gap-2">
            {liveBadge > 0 && (
              <Button size="sm" variant="outline" className="relative border-brand-yellow" onClick={() => { setLiveBadge(0); setTab("bookings"); }}>
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{liveBadge > 9 ? "9+" : liveBadge}</span>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onExit}><X className="w-4 h-4 mr-1" /> Exit</Button>
          </div>
        </header>
        <main ref={mainContentRef} className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {tab === "dashboard" && <DashboardView key={refreshTick} />}
          {tab === "bookings" && <BookingsView key={refreshTick} />}
          {tab === "price" && <PriceMasterView />}
          {tab === "zones" && <ZonesView />}
          {tab === "coupons" && <CouponsView />}
          {tab === "reports" && <ReportsView />}
          {tab === "departments" && <DepartmentsView />}
          {tab === "suppliers" && <SuppliersView />}
          {tab === "products" && <ProductsView />}
          {tab === "apks" && <ApksView />}
          {tab === "users" && <UsersView />}
          {tab === "activity" && <ActivityView />}
          {tab === "settings" && <SettingsView />}
          {tab === "system" && <SystemView />}
          {tab === "domain" && <DomainView />}
        </main>
      </div>
    </div>
  );
}

/* -------------------- Login -------------------- */
function LoginView({ onSuccess, onForcePwChange, onExit }: { onSuccess: () => void; onForcePwChange: () => void; onExit: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetLink, setResetLink] = useState("");

  const submit = async () => {
    setLoading(true);
    try {
      const r: any = await api.adminLogin(email, password);
      toast.success("Logged in");
      if (r.admin?.forcePasswordChange) onForcePwChange();
      else onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async () => {
    setLoading(true); setResetMsg(""); setResetLink("");
    try {
      const r = await fetch("/api/admin/password-reset/request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await r.json();
      // ALWAYS show the generic message — never reveal whether the email exists
      setResetMsg(data.message || "If this account exists, a reset link has been sent.");
      if (data.resetLink) setResetLink(data.resetLink);
      toast.success("Reset request submitted");
    } catch {
      setResetMsg("If this account exists, a reset link has been sent.");
    } finally { setLoading(false); }
  };

  const confirmReset = async () => {
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/admin/password-reset/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.error || "Reset failed"); }
      else { toast.success(data.message || "Password reset successful"); setMode("login"); setResetToken(""); setNewPassword(""); setResetMsg(""); setResetLink(""); }
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="absolute inset-0 brand-gradient opacity-10" />
      <Card className="w-full max-w-sm relative">
        <CardHeader className="text-center">
          <img src="/logo.png" alt="ParcelMaadi" className="w-16 h-16 mx-auto rounded-xl bg-white p-2" />
          <CardTitle className="text-2xl">{mode === "login" ? "Admin Login" : mode === "forgot" ? "Reset Password" : "Set New Password"}</CardTitle>
          <CardDescription>ParcelMaadi Control Panel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mode === "login" && (
            <>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
              <Button className="w-full bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold" onClick={submit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}Login
              </Button>
              <button type="button" className="w-full text-xs text-brand-red hover:underline" onClick={() => { setMode("forgot"); setResetMsg(""); setResetLink(""); }}>Forgot password?</button>
              <Button variant="ghost" className="w-full" onClick={onExit}>Back to Website</Button>
              <p className="text-xs text-center text-muted-foreground">🔒 Admin access only. Change default password after first login.</p>
            </>
          )}
          {mode === "forgot" && (
            <>
              <p className="text-xs text-muted-foreground">Enter your registered admin email. A single-use reset link (valid 20 min) will be sent. Rate-limited to 3 requests/hour.</p>
              <div><Label htmlFor="resetEmail">Registered email</Label><Input id="resetEmail" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && requestReset()} /></div>
              <Button className="w-full bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold" onClick={requestReset} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Send Reset Link
              </Button>
              {resetMsg && <div className="text-xs text-center text-muted-foreground bg-muted/50 rounded p-2">{resetMsg}</div>}
              {resetLink && (
                <div className="text-xs bg-brand-yellow/10 border border-brand-yellow rounded p-2 break-all">
                  <div className="font-semibold mb-1">Dev/preview mode (no email tool configured):</div>
                  <a href={resetLink} className="text-brand-red underline">Open reset link →</a>
                  <button type="button" className="block mt-1 text-muted-foreground hover:underline" onClick={() => { setResetToken(resetLink.split("token=")[1] || ""); setMode("reset"); }}>Enter token manually</button>
                </div>
              )}
              <Button variant="ghost" className="w-full" onClick={() => setMode("login")}>← Back to login</Button>
            </>
          )}
          {mode === "reset" && (
            <>
              <div><Label htmlFor="rtoken">Reset token</Label><Input id="rtoken" value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Paste token from reset link" /></div>
              <div><Label htmlFor="npw">New password (min 8 chars)</Label><Input id="npw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmReset()} /></div>
              <Button className="w-full bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold" onClick={confirmReset} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Reset Password
              </Button>
              <p className="text-xs text-center text-muted-foreground">All active sessions will be invalidated after reset.</p>
              <Button variant="ghost" className="w-full" onClick={() => setMode("login")}>← Back to login</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Dashboard -------------------- */
function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.adminDashboard()); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (loading || !data) return <Loading />;
  const kpis = [
    { label: "Today's Bookings", value: data.todayBookings, color: "bg-brand-yellow text-brand-black" },
    { label: "Total Bookings", value: data.totalBookings, color: "bg-brand-black text-white" },
    { label: "Pending", value: data.pendingCount, color: "bg-yellow-100 text-yellow-800" },
    { label: "Confirmed", value: data.confirmedCount, color: "bg-blue-100 text-blue-800" },
    { label: "Driver Assigned", value: data.driverAssignedCount, color: "bg-purple-100 text-purple-800" },
    { label: "In Progress", value: data.inProgressCount, color: "bg-orange-100 text-orange-800" },
    { label: "Delivered", value: data.deliveredCount, color: "bg-green-100 text-green-800" },
    { label: "Completed", value: data.completedCount, color: "bg-green-600 text-white" },
    { label: "Cancelled", value: data.cancelledCount, color: "bg-red-100 text-red-800" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">₹{data.totalEstimate.toLocaleString("en-IN")}</div>
          <div className="text-sm text-muted-foreground">Total estimate value</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-green-600">₹{data.paidAmount.toLocaleString("en-IN")}</div>
          <div className="text-sm text-muted-foreground">Paid (verified)</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className={`p-4 rounded-lg ${k.color}`}>
              <div className="text-2xl font-extrabold">{k.value}</div>
              <div className="text-xs opacity-80">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Bookings by Service</CardTitle></CardHeader>
        <CardContent>
          {data.serviceWise.length === 0 ? <p className="text-sm text-muted-foreground">No bookings yet.</p> : (
            <div className="space-y-2">
              {data.serviceWise.map((s: any) => (
                <div key={s.serviceId} className="flex items-center gap-3">
                  <span className="text-sm w-48 truncate">{s.name}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full brand-gradient" style={{ width: `${Math.min(100, (s.count / Math.max(...data.serviceWise.map((x: any) => x.count))) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Bookings -------------------- */
function BookingsView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.adminBookings(status, q); setBookings(r.bookings || []); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [status, q]);
  useEffect(() => { load(); }, [load]);
  const exportBookings = async (format: string) => {
    try {
      const r = await api.adminExportBookings(format, status);
      if (!r.ok) throw new Error("Export failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `parcelmaadi-bookings-${Date.now()}.${format === "csv" ? "csv" : "xls"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (e: any) { toast.error(e.message); }
  };
  const clearDemo = async () => {
    if (!confirm("⚠️ This will DELETE ALL bookings, customers and payments. Master data (services/vehicles/prices) is preserved. Continue?")) return;
    try { await api.adminClearDemo(); toast.success("Demo data cleared"); load(); } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search booking id, mobile, name, address..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" onKeyDown={(e) => e.key === "Enter" && load()} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {ORDER_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={load} variant="outline"><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
        <Button onClick={() => exportBookings("csv")} variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> CSV</Button>
        <Button onClick={() => exportBookings("xlsx")} variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Excel</Button>
        <Button onClick={clearDemo} variant="outline" size="sm" className="text-red-600 border-red-300"><Ban className="w-4 h-4 mr-1" /> Clear Demo</Button>
      </div>
      {loading ? <Loading /> : bookings.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No bookings found.</CardContent></Card>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pm-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2 font-semibold">Booking ID</th>
                  <th className="text-left p-2 font-semibold">Customer</th>
                  <th className="text-left p-2 font-semibold">Service</th>
                  <th className="text-left p-2 font-semibold">Pickup → Drop</th>
                  <th className="text-right p-2 font-semibold">Estimate</th>
                  <th className="text-center p-2 font-semibold">Status</th>
                  <th className="text-center p-2 font-semibold">Payment</th>
                  <th className="text-center p-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...bookings].sort((a: any, b: any) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0)).map((b: any) => (
                  <tr key={b.id} className={`border-t hover:bg-muted/40 ${b.isEmergency ? "bg-red-50 border-l-4 border-l-red-600" : ""}`}>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-brand-red text-xs">{b.bookingId}</span>
                        {b.isEmergency && <Badge className="bg-red-600 text-white text-[9px] animate-pulse">🚨 EMERGENCY</Badge>}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{new Date(b.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{b.customer?.name}</div>
                      <div className="text-[10px] text-muted-foreground">{b.customer?.mobile}</div>
                    </td>
                    <td className="p-2">
                      <div>{b.service?.name}</div>
                      <div className="text-[10px] text-muted-foreground">{b.vehicle?.name}{b.supplier?.shopName && ` · ${b.supplier.shopName}`}</div>
                    </td>
                    <td className="p-2 max-w-[200px]">
                      <div className="text-xs truncate">{b.pickupAddress || "—"}</div>
                      <div className="text-xs truncate text-muted-foreground">→ {b.dropAddress || "—"}</div>
                      {b.distanceKm != null && <div className="text-[10px] text-muted-foreground">{b.distanceKm} km{b.tripType && ` · ${b.tripType}`}{b.durationHours && ` · ${b.durationHours}h`}{b.durationDays && ` · ${b.durationDays}d`}</div>}
                    </td>
                    <td className="p-2 text-right font-bold">{b.finalEstimate ? `₹${b.finalEstimate}` : "Quote"}</td>
                    <td className="p-2 text-center"><StatusBadge status={b.status} /></td>
                    <td className="p-2 text-center"><Badge variant="outline" className="text-[10px]">{b.paymentStatus}</Badge></td>
                    <td className="p-2 text-center">
                      <Button size="sm" variant="outline" onClick={() => setSelected(b)}>Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {selected && <BookingDrawer booking={selected} onClose={() => setSelected(null)} onChanged={load} />}
    </div>
  );
}

function BookingDrawer({ booking, onClose, onChanged }: { booking: Booking; onClose: () => void; onChanged: () => void }) {
  const [b, setB] = useState(booking);
  const [status, setStatus] = useState(booking.status);
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus);
  const [driverName, setDriverName] = useState(booking.driverName || "");
  const [driverMobile, setDriverMobile] = useState(booking.driverMobile || "");
  const [driverType, setDriverType] = useState(booking.driverType || "Driver");
  const [notes, setNotes] = useState(booking.adminNotes || "");
  const [adminFinal, setAdminFinal] = useState<number | null>(booking.adminFinalAmount ?? null);
  const [paymentReceived, setPaymentReceived] = useState<number>(booking.paymentReceived || 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getBooking(booking.bookingId).then((r) => setB(r.booking)).catch(() => {});
  }, [booking.bookingId]);

  const save = async (kind: "status" | "driver" | "payment") => {
    setSaving(true);
    try {
      if (kind === "status") await api.adminUpdateBookingStatus(b.id, status, notes);
      if (kind === "driver") await api.adminAssignDriver(b.id, driverName, driverMobile, driverType);
      if (kind === "payment") await api.adminUpdatePayment(b.id, { paymentStatus });
      toast.success("Updated");
      const r = await api.getBooking(booking.bookingId);
      setB(r.booking);
      onChanged();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  const saveFinal = async () => {
    setSaving(true);
    try { await api.adminUpdatePayment(b.id, { adminFinalAmount: adminFinal }); toast.success("Final amount saved"); const r = await api.getBooking(booking.bookingId); setB(r.booking); onChanged(); } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };
  const saveReceived = async () => {
    setSaving(true);
    try { await api.adminUpdatePayment(b.id, { paymentReceived }); toast.success("Payment received saved"); const r = await api.getBooking(booking.bookingId); setB(r.booking); onChanged(); } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };
  const openInvoice = async (id: number) => {
    try {
      const r = await api.adminInvoice(id);
      const w = window.open("", "_blank", "width=800,height=900");
      if (w) {
        w.document.write(renderInvoiceHTML(r.invoice));
        w.document.close();
        setTimeout(() => w.print(), 500);
      }
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pm-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Booking <span className="font-mono text-brand-red">{b.bookingId}</span></DialogTitle>
          <DialogDescription>{b.service?.name} · {b.vehicle?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Info label="Customer" value={b.customer?.name} />
            <Info label="Mobile" value={<a href={`tel:${b.customer?.mobile}`} className="text-brand-red">{b.customer?.mobile}</a>} />
            <Info label="Schedule" value={`${b.scheduleDate || "ASAP"} ${b.scheduleTime || ""}`} />
            <Info label="Distance" value={b.distanceKm != null ? `${b.distanceKm} km (${b.distanceMethod})` : "—"} />
            <Info label="Item" value={b.itemDetails} />
            <Info label="Weight/Qty" value={`${b.weight || "—"} / ${b.quantity || "—"}`} />
            <Info label="Pickup" value={b.pickupAddress} />
            <Info label="Drop" value={b.dropAddress} />
          </div>
          {(b.pickupMapLink || b.dropMapLink) && (
            <div className="flex gap-2 text-xs">
              {b.pickupMapLink && <a href={b.pickupMapLink} target="_blank" className="text-brand-red underline">Pickup map</a>}
              {b.dropMapLink && <a href={b.dropMapLink} target="_blank" className="text-brand-red underline">Drop map</a>}
            </div>
          )}
          {b.customerNotes && <Info label="Customer notes" value={b.customerNotes} />}
          <Separator />
          <div>
            <Label className="text-xs">Final estimate</Label>
            <div className="text-2xl font-extrabold text-brand-red">{b.finalEstimate ? `₹${b.finalEstimate}` : "Manual quote"}</div>
            {b.paymentOption && <div className="text-xs text-muted-foreground">Option: {b.paymentOption}</div>}
          </div>
          {b.paymentScreenshotUrl && (
            <div>
              <Label className="text-xs">Payment screenshot</Label>
              <img src={b.paymentScreenshotUrl} alt="payment" className="mt-1 max-h-48 rounded border" />
            </div>
          )}
          <Separator />
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Update Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ORDER_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Admin notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button size="sm" className="w-full" disabled={saving} onClick={() => save("status")}>Save Status</Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Assign Driver/Rider/Supplier (manual)</Label>
              <Select value={driverType} onValueChange={setDriverType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Driver", "Rider", "Supplier"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Name" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
              <Input placeholder="Mobile" value={driverMobile} onChange={(e) => setDriverMobile(e.target.value)} />
              <Button size="sm" className="w-full bg-brand-black hover:bg-brand-black/80" disabled={saving} onClick={() => save("driver")}>Assign {driverType}</Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Payment status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="w-full" disabled={saving} onClick={() => save("payment")}>Update Payment</Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Quick contact</Label>
              <div className="flex gap-2">
                <a href={`tel:${b.customer?.mobile}`} className="flex-1"><Button size="sm" variant="outline" className="w-full"><Phone className="w-4 h-4 mr-1" /> Call</Button></a>
                <a href={`https://wa.me/91${b.customer?.mobile}`} target="_blank" className="flex-1"><Button size="sm" className="w-full bg-green-600 hover:bg-green-700"><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</Button></a>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Final amount (₹)</Label>
              <Input type="number" value={adminFinal ?? ""} onChange={(e) => setAdminFinal(e.target.value ? Number(e.target.value) : null)} placeholder={String(b.finalEstimate)} />
              <Button size="sm" variant="outline" className="w-full" disabled={saving} onClick={saveFinal}>Save Final</Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Payment received (₹)</Label>
              <Input type="number" value={paymentReceived} onChange={(e) => setPaymentReceived(e.target.value ? Number(e.target.value) : 0)} />
              <Button size="sm" variant="outline" className="w-full" disabled={saving} onClick={saveReceived}>Save Received</Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Invoice</Label>
              <Button size="sm" variant="outline" className="w-full" onClick={() => openInvoice(b.id)}><FileText className="w-4 h-4 mr-1" /> Generate / Print</Button>
              <p className="text-[10px] text-muted-foreground">Opens a printable invoice in a new tab.</p>
            </div>
          </div>
          {b.statusHistory && b.statusHistory.length > 0 && (
            <div>
              <Label className="text-xs font-bold">Status history</Label>
              <div className="mt-1 space-y-1 max-h-40 overflow-y-auto pm-scroll text-xs">
                {b.statusHistory.map((h) => (
                  <div key={h.id} className="flex gap-2 border-l-2 border-brand-yellow pl-2 py-0.5">
                    <span className="font-medium">{h.newStatus}</span>
                    {h.oldStatus && <span className="text-muted-foreground">(from {h.oldStatus})</span>}
                    <span className="text-muted-foreground ml-auto">{new Date(h.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                    {h.notes && <span className="text-muted-foreground">· {h.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

/* -------------------- Price Master -------------------- */
function PriceMasterView() {
  const [prices, setPrices] = useState<PriceMaster[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PriceMaster | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([api.adminPriceMaster(), api.adminServices()]);
      setPrices(p.prices || []); setServices(s.services || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Live pricing. Old bookings keep their snapshot — new bookings use latest rates.</p>
        <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> Add Price</Button>
      </div>
      {loading ? <Loading /> : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pm-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">Service</th>
                  <th className="text-left p-2">Item</th>
                  <th className="text-right p-2">Min Fare</th>
                  <th className="text-right p-2">Min KM</th>
                  <th className="text-right p-2">Per KM</th>
                  <th className="text-left p-2">Slabs</th>
                  <th className="text-right p-2">Loading</th>
                  <th className="text-right p-2">GST%</th>
                  <th className="text-right p-2">Adv%</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-center p-2"></th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/40">
                    <td className="p-2">{p.service?.name}</td>
                    <td className="p-2 font-medium">{p.itemType}</td>
                    <td className="p-2 text-right">{p.minimumFare}</td>
                    <td className="p-2 text-right">{p.minimumKm}</td>
                    <td className="p-2 text-right">{p.perKmRate || "—"}</td>
                    <td className="p-2 text-xs text-muted-foreground max-w-[180px] truncate">{p.slabJson || "—"}</td>
                    <td className="p-2 text-right">{p.loadingCharge || "—"}</td>
                    <td className="p-2 text-right">{p.gstPercent}</td>
                    <td className="p-2 text-right">{p.advancePercent}</td>
                    <td className="p-2 text-center"><Badge variant="outline" className="text-[10px]">{p.status}</Badge></td>
                    <td className="p-2 text-center">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {(editing || creating) && (
        <PriceEditDialog
          price={editing} services={services}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function PriceEditDialog({ price, services, onClose, onSaved }: { price: PriceMaster | null; services: Service[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(price ? { ...price } : { serviceId: services[0]?.id, vehicleId: null, itemType: "", minimumKm: 0, minimumFare: 0, perKmRate: 0, slabJson: "", loadingCharge: 0, waitingCharge: 0, helperCharge: 0, nightChargePercent: 0, expressChargePercent: 0, gstPercent: 5, advancePercent: 0, minimumBooking: 0, notes: "", status: "Active" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      if (price) await api.adminUpdatePrice(price.id, form);
      else await api.adminCreatePrice(form);
      toast.success("Saved");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  const num = (k: string) => (v: string) => setForm({ ...form, [k]: v === "" ? 0 : Number(v) });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pm-scroll">
        <DialogHeader><DialogTitle>{price ? "Edit Price" : "Add Price"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Service</Label>
            <Select value={String(form.serviceId)} onValueChange={(v) => setForm({ ...form, serviceId: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{services.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Item type</Label><Input value={form.itemType || ""} onChange={(e) => setForm({ ...form, itemType: e.target.value })} /></div>
          <div><Label className="text-xs">Minimum Fare ₹</Label><Input type="number" value={form.minimumFare} onChange={(e) => num("minimumFare")(e.target.value)} /></div>
          <div><Label className="text-xs">Minimum KM</Label><Input type="number" value={form.minimumKm} onChange={(e) => num("minimumKm")(e.target.value)} /></div>
          <div><Label className="text-xs">Per KM Rate (flat)</Label><Input type="number" value={form.perKmRate} onChange={(e) => num("perKmRate")(e.target.value)} /></div>
          <div><Label className="text-xs">Loading ₹</Label><Input type="number" value={form.loadingCharge} onChange={(e) => num("loadingCharge")(e.target.value)} /></div>
          <div><Label className="text-xs">Waiting ₹</Label><Input type="number" value={form.waitingCharge} onChange={(e) => num("waitingCharge")(e.target.value)} /></div>
          <div><Label className="text-xs">Helper ₹</Label><Input type="number" value={form.helperCharge} onChange={(e) => num("helperCharge")(e.target.value)} /></div>
          <div><Label className="text-xs">Night %</Label><Input type="number" value={form.nightChargePercent} onChange={(e) => num("nightChargePercent")(e.target.value)} /></div>
          <div><Label className="text-xs">Express %</Label><Input type="number" value={form.expressChargePercent} onChange={(e) => num("expressChargePercent")(e.target.value)} /></div>
          <div><Label className="text-xs">GST %</Label><Input type="number" value={form.gstPercent} onChange={(e) => num("gstPercent")(e.target.value)} /></div>
          <div><Label className="text-xs">Advance %</Label><Input type="number" value={form.advancePercent} onChange={(e) => num("advancePercent")(e.target.value)} /></div>
          <div><Label className="text-xs">Minimum booking ₹</Label><Input type="number" value={form.minimumBooking} onChange={(e) => num("minimumBooking")(e.target.value)} /></div>
          <div><Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Active", "Coming Soon", "Hidden", "Delayed", "Manual Quote Only"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label className="text-xs">Slab JSON / text (e.g. "4-10 km: 12 per km, 11-25 km: 10 per km")</Label>
            <Textarea rows={2} value={form.slabJson || ""} onChange={(e) => setForm({ ...form, slabJson: e.target.value })} />
          </div>
          <div className="col-span-2"><Label className="text-xs">Notes</Label><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={save}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Services -------------------- */
function ServicesView() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { setServices((await api.adminServices()).services || []); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const del = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    try { await api.adminDeleteService(id); toast.success("Deleted"); load(); } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Control which services appear on the customer website.</p>
        <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> Add Service</Button>
      </div>
      {loading ? <Loading /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {services.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-yellow flex items-center justify-center flex-shrink-0">
                  <ServiceIcon name={s.icon} className="w-6 h-6 text-brand-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.description}</div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{s.vehicles?.length || 0} vehicles</Badge>
                    <Badge variant="outline" className="text-[10px]">{(s as any)._count?.bookings || 0} bookings</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del(s.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <ServiceEditDialog service={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />
      )}
    </div>
  );
}

function ServiceEditDialog({ service, onClose, onSaved }: { service: Service | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(service ? { ...service } : { name: "", slug: "", description: "", icon: "Package", imageUrl: "", status: "Active", sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name?.trim()) { toast.error("Department name is required"); return; }
    setSaving(true);
    try {
      if (service) await api.adminUpdateService(service.id, form);
      else await api.adminCreateService(form);
      toast.success(service ? "Department updated" : "New department added — now visible on the website");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Department" : "Add New Department"}</DialogTitle>
          <DialogDescription>
            {service
              ? "Update this department's details. Changes appear instantly on the customer website."
              : "Create a new service department. It will appear on the customer website immediately after saving. You can add vehicles & pricing next."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Department Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Parcel Delivery, Water Supply, Machinery Rental" /></div>
          <div><Label className="text-xs">Slug (auto from name if empty)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="parcel-delivery" /></div>
          <div><Label className="text-xs">Description</Label><Textarea rows={2} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description shown on the customer website card" /></div>
          <div><Label className="text-xs">Icon (shown when no image set)</Label>
            <Select value={form.icon || "Package"} onValueChange={(v) => setForm({ ...form, icon: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Package", "Mail", "Truck", "Droplets", "HardHat", "Wrench", "ShoppingCart", "Siren"].map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <ImageUpload
              value={form.imageUrl || ""}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              label="Department Image (upload from device or paste URL)"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SERVICE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Sort order (lower = first)</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={save} className="bg-brand-yellow text-brand-black hover:bg-brand-gold">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            {service ? "Save Changes" : "Add Department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Suppliers -------------------- */
function SuppliersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { setSuppliers((await api.adminSuppliers()).suppliers || []); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (s: Supplier, status: string) => {
    try { await api.adminUpdateSupplier(s.id, { status }); toast.success(`Supplier ${status}`); load(); } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Approve suppliers so their products show on website.</p>
        <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> Add Supplier</Button>
      </div>
      {loading ? <Loading /> : suppliers.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No suppliers yet.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {suppliers.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div>
                    <div className="font-bold">{s.supplierName}</div>
                    <div className="text-xs text-muted-foreground">{s.shopName} · {s.supplierType}</div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${s.status === "Approved" ? "bg-green-100 text-green-800" : s.status === "Rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{s.status}</Badge>
                </div>
                <div className="text-xs mt-2 space-y-0.5">
                  <div>📞 {s.mobile} {s.whatsapp && `· WhatsApp ${s.whatsapp}`}</div>
                  <div>📍 {s.address}</div>
                  <div>🏷️ Commission: {s.commissionPercent}% · Products: {s._count?.products || 0}</div>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(s)}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
                  {s.status !== "Approved" && <Button size="sm" variant="outline" className="h-7 text-xs text-green-700" onClick={() => setStatus(s, "Approved")}><Check className="w-3 h-3 mr-1" /> Approve</Button>}
                  {s.status !== "Rejected" && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => setStatus(s, "Rejected")}>Reject</Button>}
                  {s.status !== "Hidden" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(s, "Hidden")}>Hide</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {(editing || creating) && <SupplierEditDialog supplier={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />}
    </div>
  );
}

function SupplierEditDialog({ supplier, onClose, onSaved }: { supplier: Supplier | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(supplier ? { ...supplier } : { supplierName: "", shopName: "", mobile: "", whatsapp: "", address: "", supplierType: "", serviceArea: "", commissionPercent: 0, upiId: "", status: "Pending" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      if (supplier) await api.adminUpdateSupplier(supplier.id, form);
      else await api.adminCreateSupplier(form);
      toast.success("Saved"); onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto pm-scroll">
        <DialogHeader><DialogTitle>{supplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Supplier name *</Label><Input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} /></div>
          <div><Label className="text-xs">Shop name</Label><Input value={form.shopName || ""} onChange={(e) => setForm({ ...form, shopName: e.target.value })} /></div>
          <div><Label className="text-xs">Type</Label><Input value={form.supplierType || ""} onChange={(e) => setForm({ ...form, supplierType: e.target.value })} placeholder="Grocery / Material" /></div>
          <div><Label className="text-xs">Mobile</Label><Input value={form.mobile || ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
          <div><Label className="text-xs">WhatsApp</Label><Input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div className="col-span-2"><Label className="text-xs">Address</Label><Textarea rows={2} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label className="text-xs">Service area</Label><Input value={form.serviceArea || ""} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} /></div>
          <div><Label className="text-xs">Commission %</Label><Input type="number" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: Number(e.target.value) })} /></div>
          <div><Label className="text-xs">UPI ID</Label><Input value={form.upiId || ""} onChange={(e) => setForm({ ...form, upiId: e.target.value })} /></div>
          <div><Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Pending", "Approved", "Rejected", "Hidden"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={save}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Products -------------------- */
function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([api.adminProducts(), api.adminSuppliers()]);
      setProducts(p.products || []); setSuppliers(s.suppliers || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))];
  const filtered = products.filter((p) => {
    if (filterCat !== "All" && p.category !== filterCat) return false;
    if (search && !`${p.productName} ${p.brand || ""} ${p.category || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const importCSV = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/admin/products/import", { method: "POST", body: fd, credentials: "include" });
      if (!r.ok) throw new Error("Import failed");
      const data = await r.json();
      toast.success(`Import complete: ${data.imported} new, ${data.updated} updated${data.errors?.length ? `, ${data.errors.length} errors` : ""}`);
      load();
    } catch (e: any) { toast.error(e.message); }
  };
  const exportCSV = () => {
    window.open("/api/admin/products/export", "_blank");
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">Manage grocery/ration products. Add, edit price/stock/image, or create new. Active products show on customer site.</p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
          <label>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCSV(f); e.target.value = ""; }} />
            <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border border-input bg-background hover:bg-accent cursor-pointer"><Upload className="w-4 h-4 mr-1" /> Import CSV</span>
          </label>
          <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
        </div>
      </div>
      {/* Search + category filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products, brands, categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {loading ? <Loading /> : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No products found. Click "Add Product" to create one.</CardContent></Card>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pm-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Supplier</th>
                  <th className="text-right p-2">MRP</th>
                  <th className="text-right p-2">Selling</th>
                  <th className="text-right p-2">Stock</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-center p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/40">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {p.photoUrl ? <img src={p.photoUrl} alt={p.productName} className="w-10 h-10 rounded object-cover border flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0"><Package className="w-4 h-4 text-muted-foreground" /></div>}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.productName}</div>
                          <div className="text-[10px] text-muted-foreground">{p.brand} · {p.packSize} · {p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">{p.supplier?.supplierName}</td>
                    <td className="p-2 text-right">₹{p.mrp}</td>
                    <td className="p-2 text-right font-bold">₹{p.sellingPrice}</td>
                    <td className="p-2 text-right">{p.stock}</td>
                    <td className="p-2 text-center"><Badge variant="outline" className={`text-[10px] ${p.status === "Active" ? "bg-green-100 text-green-800" : p.status === "Out of Stock" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{p.status}</Badge></td>
                    <td className="p-2 text-center"><Button size="sm" variant="ghost" onClick={() => setEditing(p)}><Pencil className="w-3.5 h-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {(editing || creating) && <ProductEditDialog product={editing} suppliers={suppliers} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />}
    </div>
  );
}

function ProductEditDialog({ product, suppliers, onClose, onSaved }: { product: Product | null; suppliers: Supplier[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(product ? { ...product } : { supplierId: suppliers[0]?.id, productName: "", brand: "", packSize: "", category: "Grocery Staples", subcategory: "", unit: "", mrp: 0, marketLowPrice: 0, marketHighPrice: 0, supplierPrice: 0, sellingPrice: 0, marginPercent: 10, gstPercent: 5, handlingFee: 0, stock: 0, photoUrl: "", status: "Active", priceSource: "", city: "Bengaluru", pincode: "" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.productName) { toast.error("Product name required"); return; }
    if (!form.supplierId) { toast.error("Supplier required — create a supplier first"); return; }
    setSaving(true);
    try {
      if (product) await api.adminUpdateProduct(product.id, form);
      else await api.adminCreateProduct(form);
      toast.success(product ? "Product updated!" : "Product created!");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  const num = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value === "" ? 0 : Number(e.target.value) });
  // Margin calculator: Selling Price = Supplier Price × (1 + Margin%) + Handling Fee
  const calcSellingPrice = () => {
    const sp = Number(form.supplierPrice) || 0;
    const margin = Number(form.marginPercent) || 0;
    const handling = Number(form.handlingFee) || 0;
    const calculated = Math.round((sp * (1 + margin / 100) + handling) * 100) / 100;
    setForm({ ...form, sellingPrice: calculated });
    toast.success(`Calculated: ₹${calculated} (Supplier ₹${sp} + ${margin}% margin + ₹${handling} handling)`);
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pm-scroll">
        <DialogHeader><DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs font-semibold">Product name *</Label><Input value={form.productName || ""} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="e.g. Sona Masoori Rice 5kg" /></div>
          <div><Label className="text-xs font-semibold">Supplier *</Label>
            <Select value={String(form.supplierId)} onValueChange={(v) => setForm({ ...form, supplierId: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.supplierName}</SelectItem>)}</SelectContent>
            </Select>
            {suppliers.length === 0 && <p className="text-[10px] text-red-600 mt-1">No suppliers. Create one in Suppliers tab first.</p>}
          </div>
          <div><Label className="text-xs font-semibold">Category</Label>
            <Select value={form.category || "Grocery Staples"} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Grocery Staples", "Dal & Pulses", "Oil/Dairy/Bakery", "Masala & Spices", "Vegetables & Fruits", "FMCG", "Construction/Hardware", "Other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs font-semibold">Subcategory</Label><Input value={form.subcategory || ""} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} placeholder="e.g. Rice, Pulses, Spices" /></div>
          <div><Label className="text-xs font-semibold">Brand / Type</Label><Input value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Aashirvaad, Generic/Local" /></div>
          <div><Label className="text-xs font-semibold">Unit</Label><Input value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value, packSize: e.target.value })} placeholder="e.g. 5 kg, 500ml, 1 pc" /></div>
          <div><Label className="text-xs font-semibold">City</Label><Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Bengaluru" /></div>
        </div>

        {/* Pricing section */}
        <div className="mt-4 p-3 rounded-lg border-2 border-brand-yellow/30 bg-brand-yellow/5">
          <h4 className="text-sm font-bold mb-2 flex items-center gap-1"><IndianRupee className="w-4 h-4 text-brand-red" /> Pricing Master</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label className="text-xs font-semibold">MRP ₹</Label><Input type="number" step="0.01" value={form.mrp} onChange={num("mrp")} /></div>
            <div><Label className="text-xs font-semibold">Market Low ₹</Label><Input type="number" step="0.01" value={form.marketLowPrice} onChange={num("marketLowPrice")} placeholder="Competitor low price" /></div>
            <div><Label className="text-xs font-semibold">Market High ₹</Label><Input type="number" step="0.01" value={form.marketHighPrice} onChange={num("marketHighPrice")} placeholder="Competitor high price" /></div>
            <div><Label className="text-xs font-semibold">Supplier Price ₹</Label><Input type="number" step="0.01" value={form.supplierPrice} onChange={num("supplierPrice")} /></div>
            <div><Label className="text-xs font-semibold">Margin %</Label><Input type="number" step="0.1" value={form.marginPercent} onChange={num("marginPercent")} placeholder="5-20%" /></div>
            <div><Label className="text-xs font-semibold">Handling Fee ₹</Label><Input type="number" step="0.01" value={form.handlingFee} onChange={num("handlingFee")} /></div>
            <div><Label className="text-xs font-semibold">GST %</Label><Input type="number" step="0.1" value={form.gstPercent} onChange={num("gstPercent")} /></div>
            <div><Label className="text-xs font-semibold">Selling Price ₹</Label><Input type="number" step="0.01" value={form.sellingPrice} onChange={num("sellingPrice")} className="font-bold border-brand-yellow" /></div>
            <div className="flex items-end"><Button size="sm" type="button" onClick={calcSellingPrice} className="w-full bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold h-9">Auto-Calc Price</Button></div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Formula: Selling Price = Supplier Price × (1 + Margin%) + Handling Fee. Click "Auto-Calc Price" to calculate automatically. Compare with competitor prices (Market Low/High fields).</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div><Label className="text-xs font-semibold">Stock</Label><Input type="number" value={form.stock} onChange={num("stock")} /></div>
          <div><Label className="text-xs font-semibold">Price Source</Label>
            <Select value={form.priceSource || "Manual"} onValueChange={(v) => setForm({ ...form, priceSource: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Manual", "Competitor A", "Competitor B", "Competitor C", "Local Supplier", "Local Market"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs font-semibold">Pincode</Label><Input value={form.pincode || ""} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="e.g. 560001" /></div>
          <div><Label className="text-xs font-semibold">Status</Label>
            <Select value={form.status || "Active"} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Active", "Pending", "Out of Stock", "Hidden"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Image upload — from device (mobile/laptop) or URL */}
        <div className="mt-3">
          <ImageUpload
            value={form.photoUrl || ""}
            onChange={(url) => setForm({ ...form, photoUrl: url })}
            label="Product Image"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={save} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}{product ? "Save Changes" : "Create Product"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Settings -------------------- */
function SettingsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.adminSettings()); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (loading || !data) return <Loading />;
  const s = data.settings;
  const setSetting = (key: string, value: string) => setData({ ...data, settings: { ...s, [key]: { ...(s[key] || { type: "text" }), value } } });
  const setContent = (idx: number, field: string, value: string) => {
    const content = [...data.content];
    content[idx] = { ...content[idx], [field]: value };
    setData({ ...data, content });
  };
  const save = async () => {
    setSaving(true);
    try {
      const settingsObj: any = {};
      for (const [k, v] of Object.entries(s)) settingsObj[k] = (v as any).value;
      await api.adminUpdateSettings({ settings: settingsObj, content: data.content });
      toast.success("Settings saved");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  const reseed = async () => {
    if (!confirm("Re-run seed? This re-syncs default services, prices, settings. Existing bookings are kept.")) return;
    try { await api.adminSeed(); toast.success("Seed complete"); load(); } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Brand & Contact</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <SField label="Company name" value={s.company_name?.value} onChange={(v) => setSetting("company_name", v)} />
          <SField label="Tagline" value={s.tagline?.value} onChange={(v) => setSetting("tagline", v)} />
          <SField label="Contact 1" value={s.contact_1?.value} onChange={(v) => setSetting("contact_1", v)} />
          <SField label="Contact 2" value={s.contact_2?.value} onChange={(v) => setSetting("contact_2", v)} />
          <SField label="Email" value={s.email?.value} onChange={(v) => setSetting("email", v)} />
          <SField label="GSTIN" value={s.gstin?.value} onChange={(v) => setSetting("gstin", v)} />
          <SField label="Website" value={s.website?.value} onChange={(v) => setSetting("website", v)} />
          <SField label="UPI ID" value={s.upi_id?.value} onChange={(v) => setSetting("upi_id", v)} />
          <SField label="WhatsApp number (with country code)" value={s.whatsapp_number?.value} onChange={(v) => setSetting("whatsapp_number", v)} />
          <SField label="Announcement" value={s.announcement?.value} onChange={(v) => setSetting("announcement", v)} />
          <SField label="Primary color" value={s.primary_color?.value} onChange={(v) => setSetting("primary_color", v)} />
          <SField label="Secondary color" value={s.secondary_color?.value} onChange={(v) => setSetting("secondary_color", v)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="w-5 h-5 text-brand-red" /> Notification Settings (FREE)</CardTitle>
          <CardDescription>Get instant push notifications on your phone when a new booking is placed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg p-3 space-y-1">
            <p className="text-xs font-bold text-brand-black">📱 ntfy Push Notifications (FREE — no signup)</p>
            <p className="text-[11px] text-muted-foreground">1. Install "ntfy" app on your phone (Play Store / App Store)<br/>2. Subscribe to your topic name below<br/>3. You'll get instant push notifications for every booking</p>
          </div>
          <SField label="ntfy Topic (unique name)" value={s.ntfy_topic?.value} onChange={(v) => setSetting("ntfy_topic", v)} />
          <SField label="ntfy Server URL" value={s.ntfy_server?.value} onChange={(v) => setSetting("ntfy_server", v)} />
          <div className="flex items-center gap-2 pt-1">
            <Switch checked={s.tool_ntfy?.value === "true"} onCheckedChange={(v) => setSetting("tool_ntfy", v ? "true" : "false")} id="ntfy-toggle" />
            <Label htmlFor="ntfy-toggle" className="text-xs cursor-pointer">ntfy notifications enabled</Label>
          </div>
          <Separator className="my-2" />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
            <p className="text-xs font-bold text-blue-900">💬 Telegram Bot Notifications (FREE)</p>
            <p className="text-[11px] text-muted-foreground">1. Open Telegram → search @BotFather → /newbot → get Bot Token<br/>2. Search @userinfobot → get your Chat ID<br/>3. Start your bot (send /start)</p>
          </div>
          <SField label="Telegram Bot Token" value={s.telegram_bot_token?.value} onChange={(v) => setSetting("telegram_bot_token", v)} />
          <SField label="Telegram Chat ID" value={s.telegram_chat_id?.value} onChange={(v) => setSetting("telegram_chat_id", v)} />
          <div className="flex items-center gap-2 pt-1">
            <Switch checked={s.tool_telegram?.value === "true"} onCheckedChange={(v) => setSetting("tool_telegram", v ? "true" : "false")} id="telegram-toggle" />
            <Label htmlFor="telegram-toggle" className="text-xs cursor-pointer">Telegram notifications enabled</Label>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Website Content Sections</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.content.map((c: any, i: number) => (
            <div key={c.sectionKey} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">{c.sectionKey}</Badge>
                <Select value={c.status} onValueChange={(v) => setContent(i, "status", v)}>
                  <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Active", "Hidden"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Input placeholder="Title" value={c.title || ""} onChange={(e) => setContent(i, "title", e.target.value)} />
              <Input placeholder="Subtitle" value={c.subtitle || ""} onChange={(e) => setContent(i, "subtitle", e.target.value)} />
              <Textarea rows={3} placeholder="Body" value={c.body || ""} onChange={(e) => setContent(i, "body", e.target.value)} />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={reseed}><RefreshCw className="w-4 h-4 mr-2" /> Re-sync Seed Data</Button>
        <Button disabled={saving} onClick={save} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} Save All Settings
        </Button>
      </div>
    </div>
  );
}

function SField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* -------------------- Domain Settings -------------------- */
function DomainView() {
  const [domain, setDomain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { setDomain((await api.adminDomain()).domain); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (loading || !domain) return <Loading />;
  const set = (k: string, v: string) => setDomain({ ...domain, [k]: v });
  const save = async () => {
    setSaving(true);
    try { await api.adminUpdateDomain(domain); toast.success("Domain settings saved"); } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domain & Link Settings</CardTitle>
          <CardDescription>DNS is configured at your hosting provider. These URLs are used for sitemap, WhatsApp links, canonical URLs and SEO.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <SField label="Customer website URL" value={domain.customerUrl} onChange={(v) => set("customerUrl", v)} />
          <SField label="Admin panel URL" value={domain.adminUrl} onChange={(v) => set("adminUrl", v)} />
          <SField label="API base URL" value={domain.apiBaseUrl} onChange={(v) => set("apiBaseUrl", v)} />
          <SField label="Canonical URL" value={domain.canonicalUrl} onChange={(v) => set("canonicalUrl", v)} />
          <SField label="WhatsApp booking URL" value={domain.whatsappBookingUrl} onChange={(v) => set("whatsappBookingUrl", v)} />
          <SField label="Logo URL" value={domain.logoUrl} onChange={(v) => set("logoUrl", v)} />
          <SField label="Image base URL" value={domain.imageBaseUrl} onChange={(v) => set("imageBaseUrl", v)} />
          <SField label="Sitemap URL" value={domain.sitemapUrl} onChange={(v) => set("sitemapUrl", v)} />
          <div className="col-span-2"><Label className="text-xs">robots.txt settings</Label><Textarea rows={2} value={domain.robotsSettings || ""} onChange={(e) => set("robotsSettings", e.target.value)} /></div>
          <SField label="SEO title" value={domain.seoTitle} onChange={(v) => set("seoTitle", v)} />
          <SField label="SEO description" value={domain.seoDescription} onChange={(v) => set("seoDescription", v)} />
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button disabled={saving} onClick={save} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} Save Domain Settings
        </Button>
      </div>
    </div>
  );
}

/* -------------------- Invoice HTML renderer -------------------- */
function renderInvoiceHTML(inv: any): string {
  const b = inv.breakup || {};
  // Simplified bill: show Base Amount, GST, Delivery Cost, Platform Charges
  const baseAmount = (b.baseFare || 0) + (b.distanceCharge || 0) + (b.loadingCharge || 0) + (b.waitingCharge || 0) + (b.helperCharge || 0) + (b.nightCharge || 0) + (b.expressCharge || 0) + (b.extraCharge || 0) + (b.tollParking || 0) + (b.materialCost || 0);
  const gst = b.gst || 0;
  const deliveryCost = (b.loadingCharge || 0) + (b.deliveryCharge || 0);
  const platformCharges = (b.platformFee || 0) + (b.handlingFee || 0) + (b.commissionAmount || 0);
  const discount = b.discountAmount || 0;
  const finalAmt = inv.adminFinalAmount ?? inv.finalEstimate;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.invoiceNo}</title>
  <style>
    *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
    body{margin:0;padding:32px;color:#111;background:#fff;max-width:800px;margin:0 auto}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #FACC15;padding-bottom:16px;margin-bottom:24px}
    .logo-area{display:flex;align-items:center;gap:12px}
    .logo{width:60px;height:60px;border-radius:10px;object-fit:contain}
    .brand{font-size:26px;font-weight:800;color:#DC2626}.brand span{color:#FACC15}
    .tagline{font-size:11px;color:#666;margin-top:2px}
    .legal{font-size:11px;color:#555;margin-top:6px;line-height:1.5}
    .inv-meta{text-align:right;font-size:12px;color:#555}
    .inv-no{font-size:20px;font-weight:700;color:#DC2626}
    .inv-title{font-size:14px;font-weight:700;color:#111;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
    .box{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:12px}
    .box h4{margin:0 0 6px;font-size:11px;text-transform:uppercase;color:#888;letter-spacing:.5px}
    .box p{margin:2px 0;font-size:13px}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th,td{padding:10px 12px;text-align:left;font-size:13px;border-bottom:1px solid #eee}
    th{background:#111827;color:#FACC15;font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.5px}
    td.amt{text-align:right;font-weight:600}
    .tot{display:flex;justify-content:space-between;font-size:20px;font-weight:800;padding:14px 0;border-top:3px solid #111;margin-top:8px}
    .tot span:last-child{color:#DC2626}
    .foot{margin-top:32px;text-align:center;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:12px;line-height:1.6}
    .badge{display:inline-block;background:#16A34A;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase}
    @media print{body{padding:0;max-width:none}}
  </style></head><body>
  <div class="head">
    <div class="logo-area">
      <img src="${typeof window !== "undefined" ? window.location.origin : ""}/logo.png" alt="ParcelMaadi" class="logo" onerror="this.style.display='none'">
      <div>
        <div class="brand">Parcel<span>Maadi</span></div>
        <div class="tagline">Fast · Local · Reliable</div>
        <div class="legal">Operated by <b>HP Enterprise</b><br>GSTIN: ${inv.company?.gstin || "29ANZPH4067Q1ZS"}<br>${inv.company?.email || "parcelmaadipm@gmail.com"} · ${inv.company?.contact || "9741433725"}</div>
      </div>
    </div>
    <div class="inv-meta">
      <div class="inv-title">Tax Invoice</div>
      <div class="inv-no">${inv.invoiceNo}</div>
      <div>Order ID: ${inv.bookingId}</div>
      <div>Booking Time: ${new Date(inv.date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
      <div>Status: <span class="badge">${inv.status}</span></div>
    </div>
  </div>
  <div class="grid">
    <div class="box"><h4>Bill To</h4><p><b>${inv.customer?.name || ""}</b></p><p>${inv.customer?.mobile || ""}</p><p>${inv.customer?.email || ""}</p></div>
    <div class="box"><h4>Service Details</h4><p><b>${inv.service || ""}</b></p><p>Vehicle: ${inv.vehicle || "—"}</p><p>Distance: ${inv.distanceKm || 0} km</p>${inv.etaText ? `<p>ETA: ${inv.etaText}</p>` : ""}</div>
  </div>
  <div class="grid">
    <div class="box"><h4>Pickup Location</h4><p>${inv.pickup?.address || "—"}</p>${inv.pickup?.mapLink ? `<p><a href="${inv.pickup.mapLink}" style="color:#DC2626">View on Map ↗</a></p>` : ""}</div>
    <div class="box"><h4>Drop Location</h4><p>${inv.drop?.address || "—"}</p>${inv.drop?.mapLink ? `<p><a href="${inv.drop.mapLink}" style="color:#DC2626">View on Map ↗</a></p>` : ""}</div>
  </div>
  ${inv.itemDetails || inv.weight || inv.quantity ? `<div class="box" style="margin-bottom:16px"><h4>Item Details</h4><p>${inv.itemDetails || ""} ${inv.weight ? `· Weight: ${inv.weight}` : ""} ${inv.quantity ? `· Qty: ${inv.quantity}` : ""}</p></div>` : ""}
  <table><thead><tr><th>Description</th><th style="text-align:right">Amount (₹)</th></tr></thead><tbody>
  <tr><td>Base Amount</td><td class="amt">${baseAmount.toFixed(2)}</td></tr>
  ${deliveryCost > 0 ? `<tr><td>Delivery Charges</td><td class="amt">${deliveryCost.toFixed(2)}</td></tr>` : ""}
  ${platformCharges > 0 ? `<tr><td>Platform Charges</td><td class="amt">${platformCharges.toFixed(2)}</td></tr>` : ""}
  ${gst > 0 ? `<tr><td>GST</td><td class="amt">${gst.toFixed(2)}</td></tr>` : ""}
  </tbody></table>
  <div class="tot"><span>Total Amount</span><span>₹${finalAmt}</span></div>
  <div class="box" style="margin-top:16px"><h4>Payment Details</h4><p>Option: <b>${inv.paymentOption || "—"}</b></p><p>Status: ${inv.paymentStatus}</p>${inv.paymentReceived ? `<p>Amount Received: ₹${inv.paymentReceived}</p>` : ""}</div>
  ${inv.driverName ? `<div class="box" style="margin-top:12px"><h4>Delivery Assigned To</h4><p><b>${inv.driverName}</b> · ${inv.driverMobile || ""}</p></div>` : ""}
  <div class="foot">
    <b>Thank you for choosing ParcelMaadi!</b><br>
    This is a computer-generated invoice and does not require a physical signature.<br>
    © ${new Date().getFullYear()} HP Enterprise · GSTIN: ${inv.company?.gstin || "29ANZPH4067Q1ZS"} · Made for Karnataka 🇮🇳
  </div>
  </body></html>`;
}

/* -------------------- Admin Users -------------------- */
function UsersView() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers((await api.adminUsers()).users || []); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Multiple admin users with role-based access. Owner manages all.</p>
        <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> Add Admin</Button>
      </div>
      {loading ? <Loading /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${u.role === "Owner" ? "bg-brand-red" : u.role === "Operations" ? "bg-brand-yellow text-brand-black" : u.role === "Accounts" ? "bg-blue-600" : "bg-muted-foreground"}`}>{(u.name || u.email)[0]?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{u.name || u.email}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                  <div className="flex gap-2 mt-1"><Badge variant="outline" className="text-[10px]">{u.role}</Badge><Badge variant="outline" className={`text-[10px] ${u.status === "Active" ? "text-green-700" : "text-red-600"}`}>{u.status}</Badge></div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditing(u)}><Pencil className="w-3.5 h-3.5" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {(creating || editing) && <UserEditDialog user={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />}
    </div>
  );
}

function UserEditDialog({ user, onClose, onSaved }: { user: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(user ? { ...user } : { name: "", email: "", mobile: "", role: "View", password: "", status: "Active" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      if (user) await api.adminUpdateUser(user.id, form);
      else await api.adminCreateUser(form);
      toast.success("Saved"); onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{user ? "Edit Admin User" : "Add Admin User"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="text-xs">Mobile</Label><Input value={form.mobile || ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ADMIN_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Active", "Inactive"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">{user ? "New password (leave blank to keep)" : "Password"}</Label><Input type="password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Activity Log -------------------- */
function ActivityView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/activity", { credentials: "include" });
      if (!r.ok) { if (r.status === 403) { toast.error("Only Owner can view activity log"); return; } throw new Error("Failed"); }
      const data = await r.json();
      setLogs(data.logs || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (loading) return <Loading />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Recent admin actions: logins (success/fail), password resets. Visible to Owner role only.</p>
      {logs.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No activity logged yet.</CardContent></Card>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden max-h-[70vh] overflow-y-auto pm-scroll">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr><th className="text-left p-2">Time (IST)</th><th className="text-left p-2">Admin</th><th className="text-left p-2">Action</th><th className="text-left p-2">Detail</th><th className="text-left p-2">IP</th></tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t hover:bg-muted/40">
                  <td className="p-2 text-xs">{new Date(l.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                  <td className="p-2">{l.admin ? `${l.admin.name || l.admin.email} (${l.admin.role})` : <span className="text-muted-foreground">unknown</span>}</td>
                  <td className="p-2"><Badge variant="outline" className={`text-[10px] ${l.action === "login_failed" ? "bg-red-100 text-red-800" : l.action === "login_success" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{l.action}</Badge></td>
                  <td className="p-2 text-xs text-muted-foreground">{l.detail || "—"}</td>
                  <td className="p-2 text-xs font-mono">{l.ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------- System Settings (future tools) -------------------- */
function SystemView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.adminSettings()); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (loading || !data) return <Loading />;
  const s = data.settings;
  const setSetting = (key: string, value: string) => setData({ ...data, settings: { ...s, [key]: { ...(s[key] || { type: "bool" }), value } } });
  const save = async () => {
    setSaving(true);
    try {
      const obj: any = {};
      for (const [k, v] of Object.entries(s)) obj[k] = (v as any).value;
      await api.adminUpdateSettings({ settings: obj });
      toast.success("System settings saved");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  const tools = [
    { key: "tool_google_maps", label: "Google Maps API", desc: "Auto distance/ETA, autocomplete. Falls back to OSM + manual when off.", hasKey: "tool_google_maps_key", keyLabel: "API Key" },
    { key: "tool_whatsapp_api", label: "WhatsApp API", desc: "Auto customer/owner notifications. Falls back to click-to-send when off.", hasKey: "tool_whatsapp_api_key", keyLabel: "API Key" },
    { key: "tool_sms_otp", label: "SMS / OTP", desc: "Customer mobile OTP verification. Booking works without it.", hasKey: "tool_sms_api_key", keyLabel: "API Key" },
    { key: "tool_payment_gateway", label: "Payment Gateway (Razorpay/Cashfree/PhonePe)", desc: "Online payment. Falls back to UPI manual when off.", hasKey: "tool_payment_key_id", keyLabel: "Key ID", hasSecret: "tool_payment_key_secret", secretLabel: "Key Secret" },
    { key: "tool_email", label: "Email", desc: "Customer confirmations, admin alerts, quotations.", hasKey: "tool_email_smtp", keyLabel: "SMTP / API string" },
    { key: "tool_pdf_quotation", label: "PDF Quotation", desc: "Auto quotation PDF download/share.", hasKey: null },
    { key: "tool_gst_invoice", label: "GST Invoice", desc: "Show/hide GST on invoices and estimates.", hasKey: null },
    { key: "tool_customer_login", label: "Customer Login (future)", desc: "Order history, repeat booking, saved addresses. Guest mode when off.", hasKey: null },
    { key: "tool_partner_rider", label: "Partner/Rider (future)", desc: "Rider list, vehicle-owner list. Manual assignment only.", hasKey: null },
    { key: "tool_supplier", label: "Supplier Module (future)", desc: "Supplier name, item, rate, location, status, approval.", hasKey: null },
    { key: "tool_live_tracking", label: "Live Tracking (placeholder)", desc: "Not active now. Future-ready toggle.", hasKey: null },
    { key: "tool_promo_code", label: "Promo Code", desc: "Coupon, first-order discount, area discount.", hasKey: null },
    { key: "tool_wallet_credit", label: "Wallet/Credit (future)", desc: "Customer wallet, business credit, partner payout.", hasKey: null },
    { key: "tool_ratings", label: "Ratings/Feedback (future)", desc: "Customer rating after order completion.", hasKey: null },
    { key: "tool_multi_language", label: "Multi-language (future)", desc: "Kannada/English toggle. Defaults to English when off.", hasKey: null },
    { key: "tool_ntfy", label: "ntfy Push Notifications", desc: "FREE push notifications to admin phone on every booking. Install ntfy app and subscribe to your topic.", hasKey: "ntfy_topic", keyLabel: "ntfy Topic", hasExtra: "ntfy_server", extraLabel: "ntfy Server URL" },
    { key: "tool_telegram", label: "Telegram Bot Notifications", desc: "FREE Telegram messages to admin on every booking. Create bot via @BotFather.", hasKey: "telegram_bot_token", keyLabel: "Bot Token", hasSecret: "telegram_chat_id", secretLabel: "Chat ID" },
  ];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-brand-red" /> Security & Rate Limiting</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <SField label="Session timeout (minutes)" value={s.session_timeout_minutes?.value} onChange={(v) => setSetting("session_timeout_minutes", v)} />
          <SField label="Booking rate limit (per IP/min)" value={s.rate_limit_booking_per_minute?.value} onChange={(v) => setSetting("rate_limit_booking_per_minute", v)} />
          <SField label="Login rate limit (per IP/min)" value={s.rate_limit_login_per_minute?.value} onChange={(v) => setSetting("rate_limit_login_per_minute", v)} />
          <SField label="Upload max size (MB)" value={s.upload_max_size_mb?.value} onChange={(v) => setSetting("upload_max_size_mb", v)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Zap className="w-5 h-5 text-brand-red" /> Auto-Discount</CardTitle>
          <CardDescription>Auto-discount on every booking, with a commission floor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm"><Switch checked={s.porter_match_enabled?.value === "true"} onCheckedChange={(v) => setSetting("porter_match_enabled", v ? "true" : "false")} /> Auto-Discount enabled</label>
          <SField label="Minimum Commission Floor (₹)" value={s.porter_min_commission_floor?.value} onChange={(v) => setSetting("porter_min_commission_floor", v)} />
          <div>
            <Label className="text-xs">Discount Slab Table (JSON: [{`{from,to,percent}`}])</Label>
            <Textarea rows={6} className="font-mono text-xs" value={s.porter_match_bands?.value || ""} onChange={(e) => setSetting("porter_match_bands", e.target.value)} />
            <p className="text-[10px] text-muted-foreground mt-1">Default: 0-2% small, 3-4% mid, 5-6% large. Edit carefully.</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-5 h-5 text-brand-red" /> Serviceable Areas (Karnataka-first)</CardTitle>
          <CardDescription>Bookings outside these areas/cities/PINs are blocked with a clear message.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-xs">Serviceable areas (JSON array of city names + PIN prefixes)</Label>
          <Textarea rows={5} className="font-mono text-xs" value={s.serviceable_areas?.value || ""} onChange={(e) => setSetting("serviceable_areas", e.target.value)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Future Tools — ON/OFF + API Keys</CardTitle>
          <CardDescription>Every tool has a free fallback so the site never breaks if the key is missing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tools.map((t) => (
            <div key={t.key} className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-1">
                <div><span className="font-semibold text-sm">{t.label}</span><p className="text-xs text-muted-foreground">{t.desc}</p></div>
                <Switch checked={s[t.key]?.value === "true"} onCheckedChange={(v) => setSetting(t.key, v ? "true" : "false")} />
              </div>
              {t.hasKey && (
                <div className="mt-2"><Label className="text-[10px]">{t.keyLabel}</Label><Input type="password" value={s[t.hasKey]?.value || ""} onChange={(e) => setSetting(t.hasKey, e.target.value)} placeholder="Paste key — stored in DB, never in code" /></div>
              )}
              {t.hasSecret && (
                <div className="mt-2"><Label className="text-[10px]">{t.secretLabel}</Label><Input type="password" value={s[t.hasSecret]?.value || ""} onChange={(e) => setSetting(t.hasSecret, e.target.value)} /></div>
              )}
              {t.hasExtra && (
                <div className="mt-2"><Label className="text-[10px]">{t.extraLabel}</Label><Input value={s[t.hasExtra]?.value || ""} onChange={(e) => setSetting(t.hasExtra, e.target.value)} placeholder="https://ntfy.sh" /></div>
              )}
              {t.key === "tool_payment_gateway" && (
                <div className="mt-2">
                  <Label className="text-[10px]">Provider</Label>
                  <Select value={s.tool_payment_provider?.value || "razorpay"} onValueChange={(v) => setSetting("tool_payment_provider", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["razorpay","cashfree","phonepe"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="text-[10px] text-amber-600 font-medium mt-1">⚠️ Not yet connected — bookings currently use UPI QR + screenshot verification only.</p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button disabled={saving} onClick={save} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} Save All System Settings
        </Button>
      </div>
    </div>
  );
}

/* -------------------- Force Password Change (first-time setup) -------------------- */
function ForcePasswordChangeView({ onDone, onExit }: { onDone: () => void; onExit: () => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.adminChangePassword(currentPw, newPw);
      toast.success("Password set! Welcome to ParcelMaadi Admin.");
      onDone();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="absolute inset-0 brand-gradient opacity-10" />
      <Card className="w-full max-w-md relative">
        <CardHeader className="text-center">
          <img src="/logo.png" alt="ParcelMaadi" className="w-16 h-16 mx-auto rounded-xl bg-white p-2" />
          <CardTitle className="text-2xl">Set Your Password</CardTitle>
          <CardDescription>First-time setup — please set a new secure password (min 8 chars) to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Current / temporary password</Label><Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="admin123" /></div>
          <div><Label>New password (min 8 chars)</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <div><Label>Confirm new password</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
          <Button className="w-full bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />} Set Password & Continue
          </Button>
          <Button variant="ghost" className="w-full" onClick={onExit}>Back to Website</Button>
          <p className="text-xs text-center text-muted-foreground">🔒 This is required for security on first login.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Zones -------------------- */
function ZonesView() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { setZones((await api.adminZones()).zones || []); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const del = async (id: number) => { if (!confirm("Delete zone?")) return; try { await api.adminDeleteZone(id); toast.success("Deleted"); load(); } catch (e: any) { toast.error(e.message); } };
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Zone master — manage serviceable areas + PIN codes. Used for zone-wise pricing & restrictions.</p>
        <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> Add Zone</Button>
      </div>
      {loading ? <Loading /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {zones.map((z) => (
            <Card key={z.id}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div><div className="font-bold">{z.name}</div><div className="text-xs text-muted-foreground">{z.slug}</div></div>
                  <Badge variant="outline" className="text-[10px]">{z.status}</Badge>
                </div>
                {z.cities && <div className="text-xs mt-2"><b>Cities:</b> {z.cities}</div>}
                {z.pinCodes && <div className="text-xs"><b>PINs:</b> {z.pinCodes}</div>}
                <div className="text-[10px] text-muted-foreground mt-1">{z._count?.priceMaster || 0} price rules linked</div>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(z)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del(z.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {(editing || creating) && <ZoneEditDialog zone={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />}
    </div>
  );
}

function ZoneEditDialog({ zone, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(zone ? { ...zone } : { name: "", slug: "", description: "", pinCodes: "", cities: "", status: "Active" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { if (zone) await api.adminUpdateZone(zone.id, form); else await api.adminCreateZone(form); toast.success("Saved"); onSaved(); }
    catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{zone ? "Edit Zone" : "Add Zone"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Slug (auto from name if empty)</Label><Input value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div><Label className="text-xs">Cities (comma-separated)</Label><Input value={form.cities || ""} onChange={(e) => setForm({ ...form, cities: e.target.value })} /></div>
          <div><Label className="text-xs">PIN codes (comma-separated)</Label><Input value={form.pinCodes || ""} onChange={(e) => setForm({ ...form, pinCodes: e.target.value })} /></div>
          <div><Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Active", "Inactive"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Coupons -------------------- */
function CouponsView() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { setCoupons((await api.adminCoupons()).coupons || []); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const del = async (id: number) => { if (!confirm("Delete coupon?")) return; try { await api.adminDeleteCoupon(id); toast.success("Deleted"); load(); } catch (e: any) { toast.error(e.message); } };
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Discount coupons — flat or % off, min order, max discount, usage limit, validity.</p>
        <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> Add Coupon</Button>
      </div>
      {loading ? <Loading /> : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="text-left p-2">Code</th><th className="text-left p-2">Description</th><th className="text-right p-2">Discount</th><th className="text-right p-2">Min Order</th><th className="text-right p-2">Used/Limit</th><th className="text-center p-2">Status</th><th></th></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/40">
                  <td className="p-2 font-mono font-bold text-brand-red">{c.code}</td>
                  <td className="p-2 text-xs">{c.description}</td>
                  <td className="p-2 text-right">{c.discountType === "flat" ? `₹${c.discountValue}` : `${c.discountValue}%`}</td>
                  <td className="p-2 text-right">₹{c.minOrderAmount}</td>
                  <td className="p-2 text-right text-xs">{c.usedCount}/{c.usageLimit || "∞"}</td>
                  <td className="p-2 text-center"><Badge variant="outline" className={`text-[10px] ${c.status === "Active" ? "text-green-700" : "text-red-600"}`}>{c.status}</Badge></td>
                  <td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={() => setEditing(c)}><Pencil className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => del(c.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(editing || creating) && <CouponEditDialog coupon={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />}
    </div>
  );
}

function CouponEditDialog({ coupon, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(coupon ? { ...coupon } : { code: "", description: "", discountType: "percent", discountValue: 10, minOrderAmount: 100, maxDiscount: 100, usageLimit: 100, status: "Active" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { if (coupon) await api.adminUpdateCoupon(coupon.id, form); else await api.adminCreateCoupon(form); toast.success("Saved"); onSaved(); }
    catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{coupon ? "Edit Coupon" : "Add Coupon"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" /></div>
          <div><Label className="text-xs">Description</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Type</Label>
              <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["percent", "flat"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Value</Label><Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Min order ₹</Label><Input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })} /></div>
            <div><Label className="text-xs">Max discount ₹</Label><Input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })} /></div>
          </div>
          <div><Label className="text-xs">Usage limit (0=unlimited)</Label><Input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Reports -------------------- */
function ReportsView() {
  const [period, setPeriod] = useState("monthly");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.adminReports(period)); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);
  if (loading || !data) return <Loading />;
  const exportCsv = () => {
    const rows = [["Metric", "Value"], ["Total Bookings", data.total], ["Completed", data.completed], ["Cancelled", data.cancelled], ["Revenue", data.revenue], ["Realized", data.realized], ["Pending", data.pending], ["GST", data.gst], ["Commission/Profit", data.commission], ["Discount", data.discount]];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `parcelmaadi-report-${period}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium">Period:</span>
        {["daily", "weekly", "monthly", "yearly"].map((p) => (
          <Button key={p} size="sm" variant={period === p ? "default" : "outline"} className={period === p ? "bg-brand-yellow text-brand-black" : ""} onClick={() => setPeriod(p)}>{p}</Button>
        ))}
        <Button size="sm" variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 bg-brand-yellow/20"><div className="text-2xl font-extrabold">{data.total}</div><div className="text-xs text-muted-foreground">Total Bookings</div></CardContent></Card>
        <Card><CardContent className="p-4 bg-green-50"><div className="text-2xl font-extrabold text-green-700">{data.completed}</div><div className="text-xs text-muted-foreground">Completed</div></CardContent></Card>
        <Card><CardContent className="p-4 bg-red-50"><div className="text-2xl font-extrabold text-red-700">{data.cancelled}</div><div className="text-xs text-muted-foreground">Cancelled</div></CardContent></Card>
        <Card><CardContent className="p-4 bg-blue-50"><div className="text-2xl font-extrabold text-blue-700">₹{data.revenue.toLocaleString("en-IN")}</div><div className="text-xs text-muted-foreground">Revenue</div></CardContent></Card>
        <Card><CardContent className="p-4 bg-green-50"><div className="text-2xl font-extrabold text-green-700">₹{data.realized.toLocaleString("en-IN")}</div><div className="text-xs text-muted-foreground">Realized</div></CardContent></Card>
        <Card><CardContent className="p-4 bg-orange-50"><div className="text-2xl font-extrabold text-orange-700">₹{data.pending.toLocaleString("en-IN")}</div><div className="text-xs text-muted-foreground">Pending</div></CardContent></Card>
        <Card><CardContent className="p-4 bg-purple-50"><div className="text-2xl font-extrabold text-purple-700">₹{data.gst.toLocaleString("en-IN")}</div><div className="text-xs text-muted-foreground">GST Collected</div></CardContent></Card>
        <Card><CardContent className="p-4 bg-brand-yellow/20"><div className="text-2xl font-extrabold">₹{data.commission.toLocaleString("en-IN")}</div><div className="text-xs text-muted-foreground">Profit (Commission)</div></CardContent></Card>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Service-wise</CardTitle></CardHeader>
          <CardContent>
            {data.serviceWise.length === 0 ? <p className="text-sm text-muted-foreground">No data</p> : (
              <div className="space-y-2">{data.serviceWise.map((s: any) => (
                <div key={s.name} className="flex justify-between text-sm"><span>{s.name}</span><span><b>{s.count}</b> · ₹{s.revenue.toLocaleString("en-IN")}</span></div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Vehicle-wise</CardTitle></CardHeader>
          <CardContent>
            {data.vehicleWise.length === 0 ? <p className="text-sm text-muted-foreground">No data</p> : (
              <div className="space-y-2 max-h-60 overflow-y-auto pm-scroll">{data.vehicleWise.map((s: any) => (
                <div key={s.name} className="flex justify-between text-sm"><span>{s.name}</span><span><b>{s.count}</b> · ₹{s.revenue.toLocaleString("en-IN")}</span></div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Status-wise</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">{data.statusWise.map((s: any) => (
              <div key={s.status} className="flex justify-between text-sm"><span>{s.status}</span><span><b>{s.count}</b></span></div>
            ))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Payment-wise</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">{data.paymentWise.map((s: any) => (
              <div key={s.paymentStatus} className="flex justify-between text-sm"><span>{s.paymentStatus}</span><span><b>{s.count}</b></span></div>
            ))}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------------------- Departments (unified manager) -------------------- */
function DepartmentsView() {
  const topRef = useRef<HTMLDivElement>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [prices, setPrices] = useState<PriceMaster[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSvc, setSelectedSvc] = useState<Service | null>(null);
  const [editingSvc, setEditingSvc] = useState<Service | null>(null);
  const [creatingSvc, setCreatingSvc] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceMaster | null>(null);
  const [creatingPrice, setCreatingPrice] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, v, p, pr, su] = await Promise.all([
        api.adminServices(),
        api.adminVehicles(),
        api.adminPriceMaster(),
        api.adminProducts(),
        api.adminSuppliers(),
      ]);
      setServices(s.services || []);
      setVehicles(v.vehicles || []);
      setPrices(p.prices || []);
      setProducts(pr.products || []);
      setSuppliers(su.suppliers || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // CRITICAL FIX: scroll to TOP whenever a department is opened or closed.
  // Must run in a useEffect (AFTER React renders the new content) — calling
  // scrollTo inside the click handler runs before the DOM updates, so the
  // new (longer) content still appears scrolled to the bottom.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Instant jump first (no smooth — smooth can get interrupted by reflow)
    window.scrollTo(0, 0);
    // Then belt-and-suspenders: scroll the ref anchor into view on next frame
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ block: "start" });
      window.scrollTo(0, 0);
    });
  }, [selectedSvc]);

  const selectDept = (svc: Service) => {
    setSelectedSvc(svc);
  };
  const goBack = () => {
    setSelectedSvc(null);
  };
  const toggleServiceStatus = async (svc: Service, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = svc.status === "Active" ? "Inactive" : "Active";
    try {
      await api.adminUpdateService(svc.id, { status: next });
      toast.success(`${svc.name}: ${next === "Active" ? "ON" : "OFF"}`);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <Loading />;

  /* ---------- Detail view for a selected department ---------- */
  if (selectedSvc) {
    const svcVehicles = vehicles.filter((v) => v.serviceId === selectedSvc.id);
    const svcPrices = prices.filter((p) => p.serviceId === selectedSvc.id);
    const isSupplierShop = selectedSvc.slug === "supplier-shop";
    return (
      <div ref={topRef} className="space-y-4 scroll-mt-20">
        {/* Header: All Depts back + Edit Dept + Add Vehicle */}
        <div className="flex flex-wrap items-center justify-between gap-2 sticky top-14 bg-muted/30 backdrop-blur-sm py-2 px-2 -mx-2 rounded-md z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="outline" size="sm" onClick={goBack}>
              <ChevronLeft className="w-4 h-4 mr-1" /> All Depts
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              {selectedSvc.imageUrl ? (
                <img src={selectedSvc.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-brand-yellow flex items-center justify-center flex-shrink-0">
                  <ServiceIcon name={selectedSvc.icon} className="w-5 h-5 text-brand-black" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-extrabold text-base leading-tight truncate">{selectedSvc.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{selectedSvc.slug} · {selectedSvc.status}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={() => setEditingSvc(selectedSvc)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Dept
            </Button>
            <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold" onClick={() => setCreatingVehicle(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Vehicle
            </Button>
          </div>
        </div>

        {/* Vehicles / Sub-Items section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4" /> Vehicles & Sub-Items
              <Badge variant="outline" className="text-[10px]">{svcVehicles.length}</Badge>
            </CardTitle>
            <CardDescription>Each vehicle/sub-item below has its own pricing rule. Click edit to update.</CardDescription>
          </CardHeader>
          <CardContent>
            {svcVehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vehicles/sub-items yet. Click &quot;Add Vehicle&quot; to create one.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {svcVehicles.map((v) => {
                  const vPrices = svcPrices.filter((p) => p.vehicleId === v.id);
                  return (
                    <div key={v.id} className="rounded-lg border bg-card p-3 flex gap-3">
                      <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {v.imageUrl ? (
                          <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                        ) : (
                          <Truck className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="font-bold truncate">{v.name}</div>
                            <div className="text-[11px] text-muted-foreground">Slug: {v.slug || "—"}</div>
                            {v.maxLoad && <div className="text-[11px]">Max load: {v.maxLoad}</div>}
                            {v.recommendedUse && <div className="text-[11px] text-muted-foreground line-clamp-1">{v.recommendedUse}</div>}
                          </div>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">{v.status}</Badge>
                        </div>
                        {/* Price badges */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {vPrices.length === 0 ? (
                            <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">No price rule</Badge>
                          ) : (
                            vPrices.map((p) => (
                              <span key={p.id} className="text-[10px] bg-brand-yellow/30 text-brand-black rounded px-1.5 py-0.5 font-medium">
                                ₹{p.minimumFare} min · ₹{p.perKmRate || 0}/km
                              </span>
                            ))
                          )}
                        </div>
                        {/* Edit buttons */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingVehicle(v)}>
                            <Pencil className="w-3 h-3 mr-1" /> Edit Vehicle
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingPrice(vPrices[0] || null); if (vPrices.length === 0) setCreatingPrice(true); }}>
                            <IndianRupee className="w-3 h-3 mr-1" /> Edit Pricing
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products section — only for supplier-shop department */}
        {isSupplierShop && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-4 h-4" /> Products
                    <Badge variant="outline" className="text-[10px]">{products.length}</Badge>
                  </CardTitle>
                  <CardDescription>Approved products from approved suppliers show on the customer website.</CardDescription>
                </div>
                <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold flex-shrink-0" onClick={() => setCreatingProduct(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products yet.</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto pm-scroll">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Product</th>
                          <th className="text-left p-2">Supplier</th>
                          <th className="text-right p-2">MRP</th>
                          <th className="text-right p-2">Selling</th>
                          <th className="text-right p-2">Stock</th>
                          <th className="text-center p-2">Status</th>
                          <th className="text-center p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} className="border-t hover:bg-muted/40">
                            <td className="p-2">
                              <div className="font-medium">{p.productName}</div>
                              <div className="text-[10px] text-muted-foreground">{p.brand} · {p.packSize} · {p.category}</div>
                            </td>
                            <td className="p-2">{p.supplier?.supplierName}</td>
                            <td className="p-2 text-right">₹{p.mrp}</td>
                            <td className="p-2 text-right font-bold">₹{p.sellingPrice}</td>
                            <td className="p-2 text-right">{p.stock}</td>
                            <td className="p-2 text-center">
                              <Badge variant="outline" className={`text-[10px] ${p.status === "Active" ? "bg-green-100 text-green-800" : p.status === "Out of Stock" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{p.status}</Badge>
                            </td>
                            <td className="p-2 text-center">
                              <Button size="sm" variant="ghost" onClick={() => setEditingProduct(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        {editingSvc && (
          <ServiceEditDialog service={editingSvc} onClose={() => setEditingSvc(null)} onSaved={() => { setEditingSvc(null); load(); }} />
        )}
        {(editingVehicle || creatingVehicle) && (
          <VehicleEditDialog
            vehicle={editingVehicle}
            serviceId={selectedSvc.id}
            onClose={() => { setEditingVehicle(null); setCreatingVehicle(false); }}
            onSaved={() => { setEditingVehicle(null); setCreatingVehicle(false); load(); }}
          />
        )}
        {(editingPrice || creatingPrice) && (
          <PriceEditDialog
            price={editingPrice}
            services={services}
            onClose={() => { setEditingPrice(null); setCreatingPrice(false); }}
            onSaved={() => { setEditingPrice(null); setCreatingPrice(false); load(); }}
          />
        )}
        {(editingProduct || creatingProduct) && (
          <ProductEditDialog
            product={editingProduct}
            suppliers={suppliers}
            onClose={() => { setEditingProduct(null); setCreatingProduct(false); }}
            onSaved={() => { setEditingProduct(null); setCreatingProduct(false); load(); }}
          />
        )}
      </div>
    );
  }

  /* ---------- Department selector grid ---------- */
  return (
    <div ref={topRef} className="space-y-3 scroll-mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Unified manager for service departments. Click a department to view &amp; edit all vehicles, pricing and (for Supplier / Shop) products.
        </p>
        <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold shrink-0" onClick={() => setCreatingSvc(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add New Department
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Add New Department card (first item, dashed) */}
        <button
          type="button"
          onClick={() => setCreatingSvc(true)}
          className="text-left rounded-xl border-2 border-dashed border-brand-yellow/60 bg-brand-yellow/5 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all flex flex-col items-center justify-center min-h-[180px] p-4 group"
        >
          <div className="w-12 h-12 rounded-full bg-brand-yellow flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-brand-black" />
          </div>
          <div className="font-bold text-brand-black">Add New Department</div>
          <div className="text-[11px] text-muted-foreground text-center mt-1">Create a new service department with its own vehicles, pricing &amp; image</div>
        </button>
        {services.map((s) => {
          const vCount = vehicles.filter((v) => v.serviceId === s.id).length;
          const pCount = s.slug === "supplier-shop" ? products.length : 0;
          const isOn = s.status === "Active";
          return (
            <div
              key={s.id}
              onClick={() => selectDept(s)}
              className={`text-left rounded-xl border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer relative ${!isOn ? "opacity-60" : ""}`}
            >
              <div className="aspect-[16/9] bg-muted relative">
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ServiceIcon name={s.icon} className="w-10 h-10 text-brand-black" />
                  </div>
                )}
                <Badge
                  variant="outline"
                  className={`absolute top-2 right-2 text-[10px] ${isOn ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {isOn ? "● ON" : "○ OFF"}
                </Badge>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold truncate">{s.name}</div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
                <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{s.description}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-[10px]">{vCount} vehicles</Badge>
                  {pCount > 0 && <Badge variant="outline" className="text-[10px]">{pCount} products</Badge>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`w-full mt-2 h-7 text-xs ${isOn ? "border-red-300 text-red-700 hover:bg-red-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                  onClick={(e) => toggleServiceStatus(s, e)}
                  title={isOn ? "Turn OFF (hide from website)" : "Turn ON (show on website)"}
                >
                  {isOn ? <><Ban className="w-3 h-3 mr-1" /> Turn OFF</> : <><Check className="w-3 h-3 mr-1" /> Turn ON</>}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog: Add/Edit Department */}
      {(editingSvc || creatingSvc) && (
        <ServiceEditDialog
          service={editingSvc}
          onClose={() => { setEditingSvc(null); setCreatingSvc(false); }}
          onSaved={() => { setEditingSvc(null); setCreatingSvc(false); load(); }}
        />
      )}
    </div>
  );
}

function VehicleEditDialog({ vehicle, serviceId, onClose, onSaved }: { vehicle: Vehicle | null; serviceId: number; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(vehicle ? { ...vehicle } : { serviceId, name: "", slug: "", maxLoad: "", imageUrl: "", recommendedUse: "", status: "Active", sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name?.trim()) { toast.error("Vehicle name is required"); return; }
    setSaving(true);
    try {
      if (vehicle) await api.adminUpdateVehicle(vehicle.id, form);
      else await api.adminCreateVehicle(form);
      toast.success("Saved");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto pm-scroll">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          <DialogDescription>Vehicle / sub-item under this department.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Slug (auto from name if empty)</Label>
            <Input value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. mini-truck" />
          </div>
          <div>
            <Label className="text-xs">Max load</Label>
            <Input value={form.maxLoad || ""} onChange={(e) => setForm({ ...form, maxLoad: e.target.value })} placeholder="e.g. 500 kg" />
          </div>
          <ImageUpload
            value={form.imageUrl || ""}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            label="Vehicle / Item Image"
          />
          <div>
            <Label className="text-xs">Recommended use</Label>
            <Textarea rows={2} value={form.recommendedUse || ""} onChange={(e) => setForm({ ...form, recommendedUse: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SERVICE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Sort order</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={save}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- APKs -------------------- */
function ApksView() {
  const [apks, setApks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminApks();
      setApks(res.apks || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = apks.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${a.name || ""} ${a.developer || ""} ${a.category || ""} ${a.version || ""}`.toLowerCase().includes(q);
  });

  const stats = {
    total: apks.length,
    active: apks.filter((a) => a.status === "Active").length,
    maintenance: apks.filter((a) => a.maintenanceMode === "On").length,
    comingSoon: apks.filter((a) => a.comingSoon === true).length,
  };

  const toggleStatus = async (a: any) => {
    const next = a.status === "Active" ? "Inactive" : "Active";
    try {
      await api.adminUpdateApk(a.id, { status: next });
      toast.success(`APK turned ${next === "Active" ? "ON" : "OFF"}`);
      load();
    } catch (e: any) { toast.error(e.message); }
  };
  const toggleMaintenance = async (a: any) => {
    const next = a.maintenanceMode === "On" ? "Off" : "On";
    try {
      await api.adminUpdateApk(a.id, { maintenanceMode: next });
      toast.success(`Maintenance ${next}`);
      load();
    } catch (e: any) { toast.error(e.message); }
  };
  const del = async (a: any) => {
    if (!confirm(`Delete "${a.name}"? This cannot be undone.`)) return;
    try {
      await api.adminDeleteApk(a.id);
      toast.success("APK deleted");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">Manage downloadable APKs. Toggle status, maintenance, coming-soon and UPI payment config.</p>
        <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-gold" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> Add APK</Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card><CardContent className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Total</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Active ON</div><div className="text-2xl font-bold text-green-600">{stats.active}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Maintenance</div><div className="text-2xl font-bold text-amber-600">{stats.maintenance}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Coming Soon</div><div className="text-2xl font-bold text-blue-600">{stats.comingSoon}</div></CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search APKs by name, developer, category, version..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No APKs found. Click "Add APK" to create one.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((a) => (
            <Card key={a.id} className="flex flex-col">
              <CardContent className="p-3 flex flex-col gap-2 flex-1">
                <div className="flex items-start gap-3">
                  {a.iconUrl ? (
                    <img src={a.iconUrl} alt={a.name} className="w-12 h-12 rounded-lg object-cover border flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Smartphone className="w-5 h-5 text-muted-foreground" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {[a.developer, a.version && `v${a.version}`, a.fileSize].filter(Boolean).join(" · ")}
                    </div>
                    {a.category && <div className="text-[10px] text-muted-foreground truncate">{a.category}</div>}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className={`text-[10px] ${a.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>{a.status === "Active" ? "ON" : "OFF"}</Badge>
                  {a.maintenanceMode === "On" && <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800">Maintenance</Badge>}
                  {a.comingSoon && <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-800">Coming Soon</Badge>}
                  <Badge variant="outline" className={`text-[10px] ${a.paymentType === "Paid" ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"}`}>{a.paymentType === "Paid" ? "Paid" : "Free"}</Badge>
                </div>

                {/* UPI info for paid */}
                {a.paymentType === "Paid" && (
                  <div className="rounded-md border border-purple-200 bg-purple-50 p-2 text-[10px] space-y-0.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">UPI ID:</span><span className="font-mono font-semibold">{a.upiId || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Payee:</span><span>{a.upiPayeeName || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span><span>₹{a.paymentAmount}{a.paymentCycle ? ` / ${a.paymentCycle}` : ""}</span></div>
                  </div>
                )}

                {/* Coming soon text */}
                {a.comingSoon && a.comingSoonText && (
                  <div className="text-[10px] text-muted-foreground italic line-clamp-2">“{a.comingSoonText}”</div>
                )}

                {/* Maintenance message */}
                {a.maintenanceMode === "On" && a.maintenanceMsg && (
                  <div className="text-[10px] text-amber-700 italic line-clamp-2">⚠ {a.maintenanceMsg}</div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-4 gap-1 mt-auto pt-2">
                  <Button size="sm" variant="outline" title="Edit" onClick={() => setEditing(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="outline" title={`Turn ${a.status === "Active" ? "OFF" : "ON"}`} onClick={() => toggleStatus(a)} className={a.status === "Active" ? "text-green-600" : "text-gray-500"}><Zap className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="outline" title={`Maintenance ${a.maintenanceMode === "On" ? "Off" : "On"}`} onClick={() => toggleMaintenance(a)} className={a.maintenanceMode === "On" ? "text-amber-600 border-amber-400" : ""}><RefreshCw className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="outline" title="Delete" onClick={() => del(a)} className="text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <ApkEditDialog
          apk={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function ApkEditDialog({ apk, onClose, onSaved }: { apk: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(apk ? { ...apk } : {
    name: "", slug: "", description: "", developer: "", category: "", version: "", fileSize: "",
    iconUrl: "", downloadUrl: "", status: "Active", maintenanceMode: "Off", maintenanceMsg: "",
    comingSoon: false, comingSoonText: "", paymentType: "Free", upiId: "", upiPayeeName: "",
    paymentAmount: 0, paymentCycle: "", paymentNotes: "", qrUrl: "", sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) { toast.error("APK name required"); return; }
    setSaving(true);
    try {
      if (apk) await api.adminUpdateApk(apk.id, form);
      else await api.adminCreateApk(form);
      toast.success(apk ? "APK updated!" : "APK created!");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pm-scroll">
        <DialogHeader>
          <DialogTitle>{apk ? "Edit APK" : "Add New APK"}</DialogTitle>
          <DialogDescription>Configure APK download, status, maintenance, coming-soon and UPI payment.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs font-semibold">Name *</Label><Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. ParcelMaadi Customer App" /></div>
          <div><Label className="text-xs font-semibold">Slug</Label><Input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated from name" /></div>
          <div><Label className="text-xs font-semibold">Developer</Label><Input value={form.developer || ""} onChange={(e) => set("developer", e.target.value)} placeholder="e.g. ParcelMaadi Team" /></div>
          <div><Label className="text-xs font-semibold">Category</Label><Input value={form.category || ""} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Logistics, Shopping" /></div>
          <div><Label className="text-xs font-semibold">Version</Label><Input value={form.version || ""} onChange={(e) => set("version", e.target.value)} placeholder="e.g. 1.2.3" /></div>
          <div><Label className="text-xs font-semibold">File Size</Label><Input value={form.fileSize || ""} onChange={(e) => set("fileSize", e.target.value)} placeholder="e.g. 18 MB" /></div>
          <div><Label className="text-xs font-semibold">Sort Order</Label><Input type="number" value={form.sortOrder ?? 0} onChange={(e) => set("sortOrder", e.target.value === "" ? 0 : Number(e.target.value))} /></div>
          <div className="col-span-2"><Label className="text-xs font-semibold">Description</Label><Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Short description shown on the APK page" /></div>
        </div>

        {/* Icon upload */}
        <div className="mt-2">
          <ImageUpload value={form.iconUrl || ""} onChange={(url) => set("iconUrl", url)} label="APK Icon" />
        </div>

        {/* Download URL */}
        <div className="mt-2">
          <Label className="text-xs font-semibold">Download URL</Label>
          <Input value={form.downloadUrl || ""} onChange={(e) => set("downloadUrl", e.target.value)} placeholder="https://.../app-release.apk" />
        </div>

        {/* On/Off switch */}
        <div className="mt-2 flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="text-sm font-semibold">APK Status (On/Off)</div>
            <div className="text-[11px] text-muted-foreground">When OFF, the APK is hidden from customers.</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${form.status === "Active" ? "text-green-600" : "text-gray-500"}`}>{form.status === "Active" ? "ON (Active)" : "OFF (Inactive)"}</span>
            <Switch checked={form.status === "Active"} onCheckedChange={(v) => set("status", v ? "Active" : "Inactive")} />
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Maintenance Mode</div>
              <div className="text-[11px] text-muted-foreground">Show a maintenance banner instead of download button.</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${form.maintenanceMode === "On" ? "text-amber-700" : "text-gray-500"}`}>{form.maintenanceMode === "On" ? "On" : "Off"}</span>
              <Switch checked={form.maintenanceMode === "On"} onCheckedChange={(v) => set("maintenanceMode", v ? "On" : "Off")} />
            </div>
          </div>
          {form.maintenanceMode === "On" && (
            <div><Label className="text-xs font-semibold">Maintenance Message</Label><Input value={form.maintenanceMsg || ""} onChange={(e) => set("maintenanceMsg", e.target.value)} placeholder="e.g. We'll be back shortly. Sorry for the inconvenience." /></div>
          )}
        </div>

        {/* Coming Soon Mode */}
        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Coming Soon Mode</div>
              <div className="text-[11px] text-muted-foreground">Show a "Coming Soon" badge and message instead of download.</div>
            </div>
            <Switch checked={form.comingSoon === true} onCheckedChange={(v) => set("comingSoon", v)} />
          </div>
          {form.comingSoon && (
            <div><Label className="text-xs font-semibold">Coming Soon Text</Label><Input value={form.comingSoonText || ""} onChange={(e) => set("comingSoonText", e.target.value)} placeholder="e.g. Releasing next week — stay tuned!" /></div>
          )}
        </div>

        {/* Payment Type */}
        <div className="mt-2 rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Payment Type</div>
              <div className="text-[11px] text-muted-foreground">Free downloads or paid (UPI) downloads.</div>
            </div>
            <Select value={form.paymentType || "Free"} onValueChange={(v) => set("paymentType", v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Free">Free</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent>
            </Select>
          </div>

          {form.paymentType === "Paid" && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t mt-2">
              <div><Label className="text-xs font-semibold">UPI ID</Label><Input value={form.upiId || ""} onChange={(e) => set("upiId", e.target.value)} placeholder="e.g. parcelmaadi@upi" /></div>
              <div><Label className="text-xs font-semibold">UPI Payee Name</Label><Input value={form.upiPayeeName || ""} onChange={(e) => set("upiPayeeName", e.target.value)} placeholder="e.g. ParcelMaadi Pvt Ltd" /></div>
              <div><Label className="text-xs font-semibold">Payment Amount ₹</Label><Input type="number" step="0.01" value={form.paymentAmount ?? 0} onChange={(e) => set("paymentAmount", e.target.value === "" ? 0 : Number(e.target.value))} /></div>
              <div><Label className="text-xs font-semibold">Payment Cycle</Label>
                <Select value={form.paymentCycle || ""} onValueChange={(v) => set("paymentCycle", v)}>
                  <SelectTrigger><SelectValue placeholder="One-time / Monthly / Yearly" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="One-time">One-time</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label className="text-xs font-semibold">QR Image URL</Label><Input value={form.qrUrl || ""} onChange={(e) => set("qrUrl", e.target.value)} placeholder="https://.../upi-qr.png" /></div>
              <div className="col-span-2"><Label className="text-xs font-semibold">Payment Notes</Label><Textarea value={form.paymentNotes || ""} onChange={(e) => set("paymentNotes", e.target.value)} rows={2} placeholder="Instructions shown to customer before payment" /></div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={save} className="bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold">{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}{apk ? "Save Changes" : "Create APK"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Loading -------------------- */
function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
    </div>
  );
}
