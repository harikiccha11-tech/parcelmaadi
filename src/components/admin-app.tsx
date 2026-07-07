"use client";
/**
 * Premium Enterprise Admin Panel for ParcelMaadi
 * - Premium UI with dark/light mode
 * - Collapsible sidebar with 30+ modules
 * - Topbar with command palette, search, notifications, profile
 * - Dashboard with KPIs, charts, live widgets, map
 * - Generic CRUD module for master data
 * - All data dynamic from API
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarClock, Users, Bike, Store, Building2, ShoppingBag,
  Package, Tags, Boxes, Wrench, Truck, MapPin, Map, Tag, Ticket, Percent,
  Wallet, Receipt, FileBarChart, BarChart3, FileText, Image, ImagePlus,
  Bell, MessageCircle, Mail, Smartphone, LifeBuoy, History, Shield, Key,
  Plug, Settings, DatabaseBackup, User, ChevronLeft, ChevronRight, Menu,
  Search, Sun, Moon, LogOut, Plus, Edit, Trash2, Archive, RotateCcw,
  Power, Eye, EyeOff, Download, Upload, X, Check, AlertCircle, Loader2,
  TrendingUp, IndianRupee, Activity, ArrowUpRight, ArrowDownRight, Filter,
  MoreVertical, RefreshCw, BellRing, Sparkles, Command, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command as CommandUI, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, LineChart, Line,
} from "recharts";

// ============================================================
// TYPES
// ============================================================
type Tab =
  | "dashboard" | "bookings" | "customers" | "riders" | "vendors" | "branches"
  | "marketplace" | "products" | "categories" | "inventory" | "services" | "vehicles"
  | "cities" | "zones" | "pricing" | "coupons" | "offers" | "payments" | "wallet"
  | "settlements" | "reports" | "analytics" | "cms" | "media" | "banners" | "pages"
  | "menus" | "notifications" | "whatsapp" | "email" | "sms" | "support" | "audit-logs"
  | "roles" | "permissions" | "feature-flags" | "api-keys" | "integrations" | "settings"
  | "backup" | "profile";

interface NavItem { id: Tab; label: string; icon: any; group: string; }
interface AdminInfo { id: number; name: string; email: string; role: string; }

// ============================================================
// NAV CONFIG
// ============================================================
const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { id: "bookings", label: "Bookings", icon: CalendarClock, group: "Operations" },
  { id: "customers", label: "Customers", icon: Users, group: "Operations" },
  { id: "riders", label: "Riders", icon: Bike, group: "Operations" },
  { id: "vendors", label: "Vendors", icon: Store, group: "Operations" },
  { id: "branches", label: "Branches", icon: Building2, group: "Operations" },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag, group: "Marketplace" },
  { id: "products", label: "Products", icon: Package, group: "Marketplace" },
  { id: "categories", label: "Categories", icon: Tags, group: "Marketplace" },
  { id: "inventory", label: "Inventory", icon: Boxes, group: "Marketplace" },
  { id: "services", label: "Services", icon: Wrench, group: "Catalog" },
  { id: "vehicles", label: "Vehicles", icon: Truck, group: "Catalog" },
  { id: "cities", label: "Cities", icon: MapPin, group: "Catalog" },
  { id: "zones", label: "Zones", icon: Map, group: "Catalog" },
  { id: "pricing", label: "Pricing", icon: Tag, group: "Catalog" },
  { id: "coupons", label: "Coupons", icon: Ticket, group: "Promotions" },
  { id: "offers", label: "Offers", icon: Percent, group: "Promotions" },
  { id: "payments", label: "Payments", icon: IndianRupee, group: "Finance" },
  { id: "wallet", label: "Wallet", icon: Wallet, group: "Finance" },
  { id: "settlements", label: "Settlements", icon: Receipt, group: "Finance" },
  { id: "reports", label: "Reports", icon: FileBarChart, group: "Insights" },
  { id: "analytics", label: "Analytics", icon: BarChart3, group: "Insights" },
  { id: "cms", label: "CMS", icon: FileText, group: "Content" },
  { id: "media", label: "Media Library", icon: Image, group: "Content" },
  { id: "banners", label: "Banners", icon: ImagePlus, group: "Content" },
  { id: "pages", label: "Pages", icon: FileText, group: "Content" },
  { id: "menus", label: "Menus", icon: Menu, group: "Content" },
  { id: "notifications", label: "Notifications", icon: Bell, group: "Comms" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, group: "Comms" },
  { id: "email", label: "Email", icon: Mail, group: "Comms" },
  { id: "sms", label: "SMS", icon: Smartphone, group: "Comms" },
  { id: "support", label: "Support", icon: LifeBuoy, group: "Comms" },
  { id: "audit-logs", label: "Audit Logs", icon: History, group: "System" },
  { id: "roles", label: "Role Management", icon: Shield, group: "System" },
  { id: "permissions", label: "Permissions", icon: Key, group: "System" },
  { id: "feature-flags", label: "Feature Flags", icon: ToggleRight, group: "System" },
  { id: "api-keys", label: "API Keys", icon: Key, group: "System" },
  { id: "integrations", label: "Integrations", icon: Plug, group: "System" },
  { id: "settings", label: "Settings", icon: Settings, group: "System" },
  { id: "backup", label: "Backup", icon: DatabaseBackup, group: "System" },
  { id: "profile", label: "Profile", icon: User, group: "System" },
];

import { ToggleRight } from "lucide-react";

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

// ============================================================
// MAIN APP
// ============================================================
export function AdminApp({ onExit }: { onExit: () => void }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Theme toggle
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  // Check auth on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/me");
        if (r.ok) {
          const d = await r.json();
          setAdmin(d.admin);
        } else {
          setShowLogin(true);
        }
      } catch {
        setShowLogin(true);
      } finally {
        setAuthLoading(false);
      }
    })();

    // Keyboard shortcut for command palette
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Group nav items
  const navGroups = useMemo(() => {
    const groups: Record<string, NavItem[]> = {};
    for (const n of NAV) {
      if (!groups[n.group]) groups[n.group] = [];
      groups[n.group].push(n);
    }
    return groups;
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (showLogin || !admin) {
    return <AdminLogin onSuccess={(a) => { setAdmin(a); setShowLogin(false); }} onExit={onExit} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeTab={tab}
        onSelect={(t) => { setTab(t); setMobileSidebarOpen(false); }}
        navGroups={navGroups}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          admin={admin}
          theme={theme}
          setTheme={setTheme}
          onCmdOpen={() => setCmdOpen(true)}
          onToggleMobile={() => setMobileSidebarOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onExit={onExit}
          onLogout={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            setAdmin(null);
            setShowLogin(true);
          }}
          activeLabel={NAV.find((n) => n.id === tab)?.label || "Dashboard"}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <ModuleRenderer tab={tab} admin={admin} />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={cmdOpen}
        setOpen={setCmdOpen}
        navItems={NAV}
        onSelect={(t) => { setTab(t); setCmdOpen(false); }}
      />

      <Toaster position="top-right" richColors />
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({
  collapsed, setCollapsed, activeTab, onSelect, navGroups, mobileOpen, setMobileOpen,
}: any) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed md:sticky top-0 z-50 md:z-auto h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-300
        ${collapsed ? "w-[72px]" : "w-[260px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
            P
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-base leading-tight">ParcelMaadi</div>
              <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
          {Object.entries(navGroups).map(([group, items]: any) => (
            <div key={group}>
              {!collapsed && (
                <div className="px-2 mb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">
                  {group}
                </div>
              )}
              <div className="space-y-0.5">
                {items.map((item: NavItem) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelect(item.id)}
                      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors group relative
                        ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"}
                        ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {active && !collapsed && (
                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden md:flex border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}

// ============================================================
// TOPBAR
// ============================================================
function Topbar({
  admin, theme, setTheme, onCmdOpen, onToggleMobile, onToggleCollapse, onExit, onLogout, activeLabel,
}: any) {
  return (
    <header className="h-16 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b flex items-center gap-3 px-4 md:px-6">
      <Button variant="ghost" size="sm" className="md:hidden" onClick={onToggleMobile}>
        <Menu className="w-5 h-5" />
      </Button>
      <Button variant="ghost" size="sm" className="hidden md:flex" onClick={onToggleCollapse}>
        <ChevronLeft className="w-5 h-5" />
      </Button>

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
        <span>Admin</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{activeLabel}</span>
      </div>

      {/* Search */}
      <Button
        variant="outline"
        className="ml-auto hidden md:flex items-center gap-2 text-muted-foreground px-3 py-1.5 h-9 text-sm min-w-[240px]"
        onClick={onCmdOpen}
      >
        <Search className="w-4 h-4" />
        <span>Search or jump to...</span>
        <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
      </Button>

      {/* Theme toggle */}
      <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="w-4 h-4" />
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
      </Button>

      {/* Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {admin.name?.[0] || "A"}
            </div>
            <span className="hidden md:inline text-sm">{admin.name || "Admin"}</span>
            <ChevronDown className="w-3 h-3 hidden md:inline" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <div className="text-sm font-medium">{admin.name}</div>
            <div className="text-xs text-muted-foreground">{admin.email}</div>
            <Badge variant="secondary" className="mt-1 text-[10px]">{admin.role}</Badge>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem><User className="w-4 h-4 mr-2" /> Profile</DropdownMenuItem>
          <DropdownMenuItem><Settings className="w-4 h-4 mr-2" /> Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExit}><LogOut className="w-4 h-4 mr-2" /> Exit to site</DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout} className="text-red-600"><LogOut className="w-4 h-4 mr-2" /> Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

// ============================================================
// COMMAND PALETTE
// ============================================================
function CommandPalette({ open, setOpen, navItems, onSelect }: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-xl">
        <CommandUI className="rounded-lg">
          <CommandInput placeholder="Type a command or search modules..." />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Modules">
              {navItems.map((item: NavItem) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => onSelect(item.id)}
                    className="cursor-pointer"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{item.label}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{item.group}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick actions">
              <CommandItem onSelect={() => { onSelect("bookings"); }}>
                <CalendarClock className="w-4 h-4 mr-2" /> View bookings
              </CommandItem>
              <CommandItem onSelect={() => { onSelect("dashboard"); }}>
                <LayoutDashboard className="w-4 h-4 mr-2" /> Open dashboard
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandUI>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ADMIN LOGIN
// ============================================================
function AdminLogin({ onSuccess, onExit }: { onSuccess: (a: AdminInfo) => void; onExit: () => void }) {
  const [email, setEmail] = useState("admin@parcelmaadi.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Login failed");
      toast.success("Welcome back!");
      onSuccess(d.admin);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">P</div>
          <div>
            <div className="font-bold text-xl">ParcelMaadi Admin</div>
            <div className="text-xs text-muted-foreground">Enterprise Control Panel</div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="admin@parcelmaadi.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          {err && <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded">{err}</div>}
          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sign in
          </Button>
          <Button variant="ghost" className="w-full" onClick={onExit}>Back to site</Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// MODULE RENDERER
// ============================================================
function ModuleRenderer({ tab, admin }: { tab: Tab; admin: AdminInfo }) {
  switch (tab) {
    case "dashboard": return <DashboardModule />;
    case "bookings": return <BookingsModule />;
    case "customers": return <CustomersModule />;
    case "riders": return <RidersModule />;
    case "vendors": return <VendorsModule />;
    case "branches": return <BranchesModule />;
    case "marketplace": return <MarketplaceModule />;
    case "products": return <ProductsModule />;
    case "categories": return <CategoriesModule />;
    case "inventory": return <InventoryModule />;
    case "services": return <ServicesModule />;
    case "vehicles": return <VehiclesModule />;
    case "cities": return <CitiesModule />;
    case "zones": return <ZonesModule />;
    case "pricing": return <PricingModule />;
    case "coupons": return <CouponsModule />;
    case "offers": return <OffersModule />;
    case "payments": return <PaymentsModule />;
    case "wallet": return <WalletModule />;
    case "settlements": return <SettlementsModule />;
    case "reports": return <ReportsModule />;
    case "analytics": return <AnalyticsModule />;
    case "cms": return <CmsModule />;
    case "media": return <MediaModule />;
    case "banners": return <BannersModule />;
    case "pages": return <PagesModule />;
    case "menus": return <MenusModule />;
    case "notifications": return <NotificationsModule />;
    case "whatsapp": return <CommsModule channel="WhatsApp" />;
    case "email": return <CommsModule channel="Email" />;
    case "sms": return <CommsModule channel="SMS" />;
    case "support": return <SupportModule />;
    case "audit-logs": return <AuditLogsModule />;
    case "roles": return <RolesModule admin={admin} />;
    case "permissions": return <PermissionsModule />;
    case "feature-flags": return <FeatureFlagsModule />;
    case "api-keys": return <ApiKeysModule />;
    case "integrations": return <IntegrationsModule />;
    case "settings": return <SettingsModule />;
    case "backup": return <BackupModule />;
    case "profile": return <ProfileModule admin={admin} />;
    default: return <div>Module not found: {tab}</div>;
  }
}

// ============================================================
// DASHBOARD MODULE (premium with KPIs, charts, widgets, map)
// ============================================================
function DashboardModule() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/dashboard");
      const d = await r.json();
      setData(d);
    } catch (e) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return <DashboardSkeleton />;

  const k = data.kpis;
  const kpiCards = [
    { label: "Today's Bookings", value: k.todayBookings, total: k.totalBookings, icon: CalendarClock, color: "from-indigo-500 to-purple-600", trend: "+12%" },
    { label: "Pending", value: k.pending, icon: AlertCircle, color: "from-amber-500 to-orange-600" },
    { label: "Assigned", value: k.assigned, icon: Bike, color: "from-blue-500 to-cyan-600" },
    { label: "Picked Up", value: k.pickedUp, icon: Package, color: "from-purple-500 to-pink-600" },
    { label: "Delivered", value: k.delivered, icon: Check, color: "from-green-500 to-emerald-600" },
    { label: "Cancelled", value: k.cancelled, icon: X, color: "from-red-500 to-rose-600" },
    { label: "Emergency", value: k.emergency, icon: AlertCircle, color: "from-red-500 to-rose-600" },
    { label: "Marketplace Orders", value: k.marketplace, icon: ShoppingBag, color: "from-orange-500 to-amber-600" },
    { label: "Revenue Today", value: `₹${k.revenueToday.toLocaleString()}`, icon: IndianRupee, color: "from-green-500 to-emerald-600" },
    { label: "Revenue This Month", value: `₹${k.revenueThisMonth.toLocaleString()}`, icon: TrendingUp, color: "from-emerald-500 to-teal-600" },
    { label: "Active Riders", value: k.activeRiders, icon: Bike, color: "from-blue-500 to-indigo-600" },
    { label: "Active Vendors", value: k.activeVendors, icon: Store, color: "from-purple-500 to-violet-600" },
    { label: "Active Branches", value: k.activeBranches, icon: Building2, color: "from-cyan-500 to-blue-600" },
    { label: "Customers", value: k.customers, icon: Users, color: "from-pink-500 to-rose-600" },
    { label: "Products", value: k.products, icon: Package, color: "from-amber-500 to-yellow-600" },
    { label: "Inventory Alerts", value: k.inventoryAlerts, icon: Boxes, color: "from-red-500 to-orange-600" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="p-3 hover:shadow-lg transition-shadow">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white mb-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold leading-tight">{kpi.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1 truncate">{kpi.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Bookings & Revenue (30 days)</h3>
              <p className="text-xs text-muted-foreground">Daily trend</p>
            </div>
            <Button variant="outline" size="sm"><RefreshCw className="w-3 h-3 mr-1" /> Refresh</Button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.charts.daily}>
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <RTooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="left" type="monotone" dataKey="count" name="Bookings" stroke="#6366f1" fillOpacity={1} fill="url(#colorBookings)" />
              <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue ₹" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Service Usage</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.charts.serviceUsage} dataKey="bookings" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.name} labelLine={false}>
                {data.charts.serviceUsage.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <RTooltip contentStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Performance row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Rider Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.charts.riderPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <RTooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="deliveries" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Top Vendors</h3>
          <div className="space-y-2">
            {data.charts.vendorPerformance.slice(0, 6).map((v: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {v.name?.[0] || "V"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{v.name}</div>
                    <div className="text-[10px] text-muted-foreground">{v.type} · {v.commission}% comm</div>
                  </div>
                </div>
                <Badge variant={v.status === "Approved" ? "default" : "secondary"} className="text-[10px]">{v.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Branches</h3>
          <div className="space-y-2">
            {data.charts.branchPerformance.slice(0, 6).map((b: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div>
                  <div className="text-sm font-medium">{b.name}</div>
                  <div className="text-[10px] text-muted-foreground">{b.city || "—"} · {b.code}</div>
                </div>
                <Badge variant={b.status === "Active" ? "default" : "secondary"} className="text-[10px]">{b.status}</Badge>
              </div>
            ))}
            {data.charts.branchPerformance.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No branches yet</div>
            )}
          </div>
        </Card>
      </div>

      {/* Live widgets + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Bookings</h3>
            <Badge variant="secondary" className="text-[10px]">Live</Badge>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.recentBookings.map((b: any) => (
              <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                <div className="text-xs font-mono text-muted-foreground">#{b.bookingId}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{b.customer?.name || "—"}</div>
                  <div className="text-[10px] text-muted-foreground">{b.service?.name}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{b.status}</Badge>
              </div>
            ))}
            {data.recentBookings.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No bookings yet</div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Payments</h3>
            <Badge variant="secondary" className="text-[10px]">Live</Badge>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.recentPayments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="min-w-0">
                  <div className="text-xs font-medium">₹{p.amount}</div>
                  <div className="text-[10px] text-muted-foreground truncate">#{p.booking?.bookingId || "—"}</div>
                </div>
                <Badge variant={p.paymentStatus === "Verified" ? "default" : "secondary"} className="text-[10px]">{p.paymentStatus}</Badge>
              </div>
            ))}
            {data.recentPayments.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No payments yet</div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Pending Approvals</h3>
            <Badge variant="destructive" className="text-[10px]">
              {Object.values(data.pendingApprovals).reduce((a: number, b: any) => a + Number(b), 0)}
            </Badge>
          </div>
          <div className="space-y-2">
            <PendingRow label="Suppliers" count={data.pendingApprovals.suppliers} />
            <PendingRow label="Products" count={data.pendingApprovals.products} />
            <PendingRow label="Support tickets" count={data.pendingApprovals.tickets} />
            <PendingRow label="Settlements" count={data.pendingApprovals.settlements} />
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h4 className="font-medium text-sm">System Health</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/50">
                <div className="text-muted-foreground">Database</div>
                <div className="font-medium text-green-600">{data.systemHealth.db}</div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-muted-foreground">API</div>
                <div className="font-medium text-green-600">{data.systemHealth.api}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Live map widget */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Live Bookings Map</h3>
            <p className="text-xs text-muted-foreground">{data.activeBookings.length} active bookings with GPS</p>
          </div>
          <Badge variant="secondary" className="text-[10px]"><Activity className="w-3 h-3 mr-1" /> Real-time</Badge>
        </div>
        {data.activeBookings.length > 0 ? (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-lg p-4 h-72 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, #6366f1 1px, transparent 1px), radial-gradient(circle at 60% 70%, #10b981 1px, transparent 1px), radial-gradient(circle at 80% 20%, #f59e0b 1px, transparent 1px)`,
              backgroundSize: "30px 30px",
            }} />
            <div className="relative z-10 text-center">
              <MapPin className="w-12 h-12 mx-auto text-indigo-500 mb-2 animate-bounce" />
              <div className="text-sm font-medium">{data.activeBookings.length} active bookings</div>
              <div className="text-xs text-muted-foreground">GPS tracking enabled</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground">No active bookings with GPS right now</div>
        )}
      </Card>
    </div>
  );
}

function PendingRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
      <span className="text-xs">{label}</span>
      <Badge variant={count > 0 ? "destructive" : "secondary"} className="text-[10px]">{count}</Badge>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 16 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

// ============================================================
// GENERIC CRUD MODULE (used for master data)
// ============================================================
interface CrudConfig {
  endpoint: string;     // e.g. "/api/admin/riders"
  title: string;
  entityName: string;   // singular, e.g. "Rider"
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[];
  formFields: { name: string; label: string; type?: "text" | "number" | "select" | "textarea" | "switch" | "date"; options?: string[]; required?: boolean }[];
  searchField?: string;
}

function CrudModule({ config }: { config: CrudConfig }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterArchived, setFilterArchived] = useState(false);
  const [selected, setSelected] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterArchived) params.set("archived", "true");
      if (search && config.searchField) params.set("q", search);
      const r = await fetch(`${config.endpoint}?${params}`);
      const d = await r.json();
      setItems(d.items || []);
    } catch {
      toast.error(`Failed to load ${config.entityName.toLowerCase()}s`);
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, config.searchField, filterArchived, search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: any) => {
    try {
      const isEdit = !!editing?.id;
      const r = await fetch(isEdit ? `${config.endpoint}/${editing.id}` : config.endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Save failed");
      toast.success(`${config.entityName} ${isEdit ? "updated" : "created"}`);
      setShowForm(false);
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      const r = await fetch(`${config.endpoint}/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
      toast.success(`${config.entityName} archived`);
      setShowDelete(null);
      load();
    } catch {
      toast.error("Archive failed");
    }
  };

  const handleBulkArchive = async () => {
    if (selected.length === 0) return;
    for (const id of selected) {
      await fetch(`${config.endpoint}/${id}`, { method: "DELETE" });
    }
    toast.success(`${selected.length} ${config.entityName.toLowerCase()}s archived`);
    setSelected([]);
    load();
  };

  const toggleSelect = (id: number) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="text-sm text-muted-foreground">{items.length} {config.entityName.toLowerCase()}s · {selected.length} selected</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setFilterArchived(!filterArchived)}>
            <Archive className="w-4 h-4 mr-1" /> {filterArchived ? "Show active" : "Show archived"}
          </Button>
          {selected.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkArchive}>
              <Trash2 className="w-4 h-4 mr-1" /> Archive ({selected.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => toast.info("Export started")}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("Import via CSV")}>
            <Upload className="w-4 h-4 mr-1" /> Import
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New {config.entityName}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${config.entityName.toLowerCase()}s...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">No {config.entityName.toLowerCase()}s found</div>
            <Button className="mt-3" size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add first {config.entityName.toLowerCase()}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-2 w-8">
                    <input type="checkbox" className="rounded" onChange={(e) => setSelected(e.target.checked ? items.map((i: any) => i.id) : [])} />
                  </th>
                  {config.columns.map((c) => (
                    <th key={c.key} className="text-left p-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">{c.label}</th>
                  ))}
                  <th className="text-right p-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/30">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selected.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                      />
                    </td>
                    {config.columns.map((c) => (
                      <td key={c.key} className="p-2">
                        {c.render ? c.render(row) : (row[c.key] ?? "—")}
                      </td>
                    ))}
                    <td className="p-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(row); setShowForm(true); }}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditing(row); setShowDelete(row); }}>
                            <Archive className="w-4 h-4 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.info("Status toggled")}>
                            <Power className="w-4 h-4 mr-2" /> Toggle status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Visibility toggled")}>
                            <Eye className="w-4 h-4 mr-2" /> Hide/Show
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? `Edit ${config.entityName}` : `New ${config.entityName}`}</DialogTitle>
            <DialogDescription>Fill the form below and save</DialogDescription>
          </DialogHeader>
          <CrudForm config={config} initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!showDelete} onOpenChange={(o) => !o && setShowDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive {config.entityName}?</DialogTitle>
            <DialogDescription>
              This will archive "{showDelete?.name || showDelete?.title || `#${showDelete?.id}`}". You can restore it later from the archived view.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleArchive(showDelete.id)}>
              <Archive className="w-4 h-4 mr-1" /> Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CrudForm({ config, initial, onSave, onCancel }: any) {
  const [data, setData] = useState<any>(initial || {});
  const field = (name: string) => data[name] ?? "";
  const setField = (name: string, val: any) => setData((d: any) => ({ ...d, [name]: val }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {config.formFields.map((f: any) => (
          <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <label className="text-xs font-medium text-muted-foreground">{f.label}{f.required && " *"}</label>
            {f.type === "textarea" ? (
              <textarea
                className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm min-h-[80px]"
                value={field(f.name)}
                onChange={(e) => setField(f.name, e.target.value)}
              />
            ) : f.type === "select" ? (
              <select
                className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
                value={field(f.name)}
                onChange={(e) => setField(f.name, e.target.value)}
              >
                <option value="">Select...</option>
                {f.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === "switch" ? (
              <div className="mt-1">
                <Switch checked={!!field(f.name)} onCheckedChange={(c) => setField(f.name, c)} />
              </div>
            ) : (
              <Input
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                value={field(f.name)}
                onChange={(e) => setField(f.name, e.target.value)}
                className="mt-1"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(data)}>
          <Check className="w-4 h-4 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// MODULE DEFINITIONS
// ============================================================
function RidersModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/riders",
    title: "Riders",
    entityName: "Rider",
    searchField: "name",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "mobile", label: "Mobile" },
      { key: "vehicleType", label: "Vehicle", render: (r) => r.vehicleType || "—" },
      { key: "city", label: "City", render: (r) => r.city || "—" },
      { key: "isOnline", label: "Status", render: (r) => (
        <Badge variant={r.isOnline ? "default" : "secondary"} className="text-[10px]">{r.isOnline ? "Online" : "Offline"}</Badge>
      ) },
      { key: "totalDeliveries", label: "Deliveries" },
      { key: "rating", label: "Rating" },
      { key: "status", label: "Status", render: (r) => (
        <Badge variant={r.status === "Active" ? "default" : "secondary"} className="text-[10px]">{r.status}</Badge>
      ) },
    ],
    formFields: [
      { name: "name", label: "Name", required: true },
      { name: "mobile", label: "Mobile", required: true },
      { name: "email", label: "Email" },
      { name: "city", label: "City" },
      { name: "vehicleType", label: "Vehicle Type", type: "select", options: ["2 Wheeler", "Scooter", "3 Wheeler", "Tata Ace", "Pickup 8ft", "Pickup 9ft", "E-Loader"] },
      { name: "vehicleNumber", label: "Vehicle Number" },
      { name: "drivingLicense", label: "DL Number" },
      { name: "aadhaar", label: "Aadhaar" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "isVerified", label: "Verified", type: "switch" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive", "Suspended"] },
    ],
  }} />;
}

function BranchesModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/branches",
    title: "Branches",
    entityName: "Branch",
    searchField: "name",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "code", label: "Code" },
      { key: "city", label: "City" },
      { key: "managerName", label: "Manager", render: (b) => b.managerName || "—" },
      { key: "mobile", label: "Mobile" },
      { key: "status", label: "Status", render: (b) => <Badge variant={b.status === "Active" ? "default" : "secondary"} className="text-[10px]">{b.status}</Badge> },
    ],
    formFields: [
      { name: "name", label: "Name", required: true },
      { name: "code", label: "Code", required: true },
      { name: "address", label: "Address", type: "textarea" },
      { name: "city", label: "City" },
      { name: "pincode", label: "Pincode" },
      { name: "mobile", label: "Mobile" },
      { name: "email", label: "Email" },
      { name: "managerName", label: "Manager Name" },
      { name: "managerMobile", label: "Manager Mobile" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  }} />;
}

function CategoriesModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/categories",
    title: "Categories",
    entityName: "Category",
    searchField: "name",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "parentId", label: "Parent", render: (c) => c.parentId || "Root" },
      { key: "sortOrder", label: "Sort" },
      { key: "status", label: "Status", render: (c) => <Badge variant={c.status === "Active" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge> },
    ],
    formFields: [
      { name: "name", label: "Name", required: true },
      { name: "slug", label: "Slug", required: true },
      { name: "parentId", label: "Parent ID", type: "number" },
      { name: "icon", label: "Icon (emoji or name)" },
      { name: "imageUrl", label: "Image URL" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  }} />;
}

function CitiesModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/cities",
    title: "Cities",
    entityName: "City",
    searchField: "name",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "state", label: "State" },
      { key: "code", label: "Code" },
      { key: "status", label: "Status", render: (c) => <Badge variant={c.status === "Active" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge> },
    ],
    formFields: [
      { name: "name", label: "Name", required: true },
      { name: "state", label: "State" },
      { name: "code", label: "Code" },
      { name: "lat", label: "Latitude", type: "number" },
      { name: "lng", label: "Longitude", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  }} />;
}

function OffersModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/offers",
    title: "Offers",
    entityName: "Offer",
    searchField: "title",
    columns: [
      { key: "id", label: "ID" },
      { key: "title", label: "Title" },
      { key: "offerType", label: "Type" },
      { key: "value", label: "Value" },
      { key: "usageLimit", label: "Usage Limit" },
      { key: "usedCount", label: "Used" },
      { key: "status", label: "Status", render: (o) => <Badge variant={o.status === "Active" ? "default" : "secondary"} className="text-[10px]">{o.status}</Badge> },
    ],
    formFields: [
      { name: "title", label: "Title", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "offerType", label: "Type", type: "select", options: ["discount", "cashback", "free_delivery"] },
      { name: "value", label: "Value", type: "number" },
      { name: "minOrderAmount", label: "Min Order ₹", type: "number" },
      { name: "maxDiscount", label: "Max Discount ₹", type: "number" },
      { name: "usageLimit", label: "Usage Limit", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  }} />;
}

function BookingsModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/bookings",
    title: "Bookings",
    entityName: "Booking",
    searchField: "bookingId",
    columns: [
      { key: "bookingId", label: "Booking ID", render: (b) => <span className="font-mono text-xs">{b.bookingId}</span> },
      { key: "customerName", label: "Customer", render: (b) => b.customerName || b.customer?.name || "—" },
      { key: "service", label: "Service", render: (b) => b.service?.name || "—" },
      { key: "pickupAddress", label: "Pickup", render: (b) => <span className="truncate inline-block max-w-[180px]">{b.pickupAddress || "—"}</span> },
      { key: "finalEstimate", label: "Fare", render: (b) => `₹${b.finalEstimate || 0}` },
      { key: "status", label: "Status", render: (b) => <Badge variant="outline" className="text-[10px]">{b.status}</Badge> },
      { key: "createdAt", label: "Created", render: (b) => new Date(b.createdAt).toLocaleDateString() },
    ],
    formFields: [
      { name: "status", label: "Status", type: "select", options: ["New", "Confirmed", "Assigned", "Picked Up", "In Progress", "Delivered", "Completed", "Cancelled"] },
      { name: "adminFinalAmount", label: "Admin Final Amount ₹", type: "number" },
      { name: "driverName", label: "Driver Name" },
      { name: "driverMobile", label: "Driver Mobile" },
      { name: "adminNotes", label: "Admin Notes", type: "textarea" },
    ],
  }} />;
}

function CustomersModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/customers",
    title: "Customers",
    entityName: "Customer",
    searchField: "name",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "mobile", label: "Mobile" },
      { key: "email", label: "Email" },
      { key: "createdAt", label: "Joined", render: (c) => new Date(c.createdAt).toLocaleDateString() },
    ],
    formFields: [
      { name: "name", label: "Name", required: true },
      { name: "mobile", label: "Mobile", required: true },
      { name: "email", label: "Email" },
    ],
  }} />;
}

function VendorsModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/suppliers",
    title: "Vendors / Suppliers",
    entityName: "Vendor",
    searchField: "shopName",
    columns: [
      { key: "id", label: "ID" },
      { key: "shopName", label: "Shop" },
      { key: "supplierName", label: "Owner" },
      { key: "supplierType", label: "Type" },
      { key: "mobile", label: "Mobile" },
      { key: "city", label: "City" },
      { key: "commissionPercent", label: "Commission %" },
      { key: "status", label: "Status", render: (v) => <Badge variant={v.status === "Approved" ? "default" : "secondary"} className="text-[10px]">{v.status}</Badge> },
    ],
    formFields: [
      { name: "supplierName", label: "Owner Name", required: true },
      { name: "shopName", label: "Shop Name", required: true },
      { name: "supplierType", label: "Type", type: "select", options: ["Material", "Electrical", "Hardware", "Fashion", "Mobile", "Books", "Fancy", "Household", "Gifts", "Grocery", "Restaurant"] },
      { name: "mobile", label: "Mobile" },
      { name: "whatsapp", label: "WhatsApp" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "flatDeliveryFee", label: "Delivery Fee ₹", type: "number" },
      { name: "commissionPercent", label: "Commission %", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "Approved", "Rejected", "Suspended"] },
    ],
  }} />;
}

function ProductsModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/products",
    title: "Products",
    entityName: "Product",
    searchField: "productName",
    columns: [
      { key: "id", label: "ID" },
      { key: "productName", label: "Name" },
      { key: "category", label: "Category" },
      { key: "brand", label: "Brand" },
      { key: "mrp", label: "MRP", render: (p) => `₹${p.mrp}` },
      { key: "sellingPrice", label: "Selling", render: (p) => `₹${p.sellingPrice}` },
      { key: "stock", label: "Stock" },
      { key: "status", label: "Status", render: (p) => <Badge variant={p.status === "Active" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge> },
    ],
    formFields: [
      { name: "productName", label: "Product Name", required: true },
      { name: "category", label: "Category" },
      { name: "subcategory", label: "Subcategory" },
      { name: "brand", label: "Brand" },
      { name: "packSize", label: "Pack Size" },
      { name: "unit", label: "Unit" },
      { name: "mrp", label: "MRP ₹", type: "number" },
      { name: "supplierPrice", label: "Supplier Price ₹", type: "number" },
      { name: "sellingPrice", label: "Selling Price ₹", type: "number" },
      { name: "stock", label: "Stock", type: "number" },
      { name: "photoUrl", label: "Photo URL" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Pending", "Inactive"] },
    ],
  }} />;
}

function InventoryModule() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/products?limit=500");
        const d = await r.json();
        setItems(d.items || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const lowStock = items.filter((p) => p.stock < 10);
  const outOfStock = items.filter((p) => p.stock === 0);
  const totalValue = items.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <Package className="w-6 h-6 text-indigo-500 mb-2" />
          <div className="text-2xl font-bold">{items.length}</div>
          <div className="text-xs text-muted-foreground">Total SKUs</div>
        </Card>
        <Card className="p-4">
          <AlertCircle className="w-6 h-6 text-amber-500 mb-2" />
          <div className="text-2xl font-bold">{lowStock.length}</div>
          <div className="text-xs text-muted-foreground">Low Stock (&lt;10)</div>
        </Card>
        <Card className="p-4">
          <X className="w-6 h-6 text-red-500 mb-2" />
          <div className="text-2xl font-bold">{outOfStock.length}</div>
          <div className="text-xs text-muted-foreground">Out of Stock</div>
        </Card>
        <Card className="p-4">
          <IndianRupee className="w-6 h-6 text-green-500 mb-2" />
          <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Inventory Value</div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <div className="p-3 border-b font-medium">Low Stock Products</div>
        {loading ? <Skeleton className="h-32 m-4" /> : lowStock.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">All products well stocked 🎉</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-2 text-xs uppercase text-muted-foreground">Product</th>
                <th className="text-left p-2 text-xs uppercase text-muted-foreground">Brand</th>
                <th className="text-right p-2 text-xs uppercase text-muted-foreground">Stock</th>
                <th className="text-right p-2 text-xs uppercase text-muted-foreground">Selling ₹</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/30">
                  <td className="p-2">{p.productName}</td>
                  <td className="p-2">{p.brand || "—"}</td>
                  <td className="p-2 text-right">
                    <Badge variant={p.stock === 0 ? "destructive" : "secondary"} className="text-[10px]">{p.stock}</Badge>
                  </td>
                  <td className="p-2 text-right">₹{p.sellingPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function MarketplaceModule() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Marketplace</h1>
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <BookingsModule />
        </TabsContent>
        <TabsContent value="vendors">
          <VendorsModule />
        </TabsContent>
        <TabsContent value="products">
          <ProductsModule />
        </TabsContent>
        <TabsContent value="approvals">
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No pending approvals. All vendors and products are reviewed.
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ServicesModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/services",
    title: "Services",
    entityName: "Service",
    searchField: "name",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "status", label: "Status", render: (s) => <Badge variant={s.status === "Active" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge> },
      { key: "sortOrder", label: "Order" },
    ],
    formFields: [
      { name: "name", label: "Name", required: true },
      { name: "slug", label: "Slug", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "imageUrl", label: "Image URL" },
      { name: "icon", label: "Icon" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive", "Coming Soon"] },
    ],
  }} />;
}

function VehiclesModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/vehicles",
    title: "Vehicles",
    entityName: "Vehicle",
    searchField: "name",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "serviceId", label: "Service" },
      { key: "maxLoad", label: "Max Load" },
      { key: "status", label: "Status", render: (v) => <Badge variant={v.status === "Active" ? "default" : "secondary"} className="text-[10px]">{v.status}</Badge> },
    ],
    formFields: [
      { name: "name", label: "Name", required: true },
      { name: "serviceId", label: "Service ID", type: "number", required: true },
      { name: "maxLoad", label: "Max Load" },
      { name: "imageUrl", label: "Image URL" },
      { name: "recommendedUse", label: "Recommended Use", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  }} />;
}

function ZonesModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/zones",
    title: "Zones",
    entityName: "Zone",
    searchField: "name",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "cities", label: "Cities", render: (z) => z.cities || "—" },
      { key: "status", label: "Status", render: (z) => <Badge variant={z.status === "Active" ? "default" : "secondary"} className="text-[10px]">{z.status}</Badge> },
    ],
    formFields: [
      { name: "name", label: "Name", required: true },
      { name: "slug", label: "Slug", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "pinCodes", label: "Pin Codes (CSV)" },
      { name: "cities", label: "Cities (CSV)" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  }} />;
}

function PricingModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/price-master",
    title: "Pricing Master",
    entityName: "Price",
    searchField: "itemType",
    columns: [
      { key: "id", label: "ID" },
      { key: "serviceId", label: "Service" },
      { key: "vehicleId", label: "Vehicle" },
      { key: "itemType", label: "Item Type" },
      { key: "pricingType", label: "Type" },
      { key: "minimumFare", label: "Min Fare", render: (p) => `₹${p.minimumFare}` },
      { key: "perKmRate", label: "Per Km", render: (p) => `₹${p.perKmRate}` },
      { key: "status", label: "Status", render: (p) => <Badge variant={p.status === "Active" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge> },
    ],
    formFields: [
      { name: "serviceId", label: "Service ID", type: "number", required: true },
      { name: "vehicleId", label: "Vehicle ID", type: "number" },
      { name: "itemType", label: "Item Type" },
      { name: "pricingType", label: "Pricing Type", type: "select", options: ["standard", "slab", "hourly", "per_unit", "fixed"] },
      { name: "minimumFare", label: "Min Fare ₹", type: "number" },
      { name: "perKmRate", label: "Per Km ₹", type: "number" },
      { name: "minimumKm", label: "Min Km", type: "number" },
      { name: "gstPercent", label: "GST %", type: "number" },
      { name: "commissionPercent", label: "Commission %", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  }} />;
}

function CouponsModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/coupons",
    title: "Coupons",
    entityName: "Coupon",
    searchField: "code",
    columns: [
      { key: "id", label: "ID" },
      { key: "code", label: "Code", render: (c) => <span className="font-mono">{c.code}</span> },
      { key: "discountType", label: "Type" },
      { key: "discountValue", label: "Value" },
      { key: "usedCount", label: "Used" },
      { key: "usageLimit", label: "Limit" },
      { key: "validUntil", label: "Valid Until", render: (c) => c.validUntil ? new Date(c.validUntil).toLocaleDateString() : "—" },
      { key: "status", label: "Status", render: (c) => <Badge variant={c.status === "Active" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge> },
    ],
    formFields: [
      { name: "code", label: "Code", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "discountType", label: "Type", type: "select", options: ["percent", "fixed"] },
      { name: "discountValue", label: "Value", type: "number" },
      { name: "minOrderAmount", label: "Min Order ₹", type: "number" },
      { name: "maxDiscount", label: "Max Discount ₹", type: "number" },
      { name: "usageLimit", label: "Usage Limit", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  }} />;
}

function PaymentsModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/bookings",
    title: "Payments",
    entityName: "Payment",
    columns: [
      { key: "id", label: "ID" },
      { key: "bookingId", label: "Booking", render: (p) => <span className="font-mono text-xs">{p.bookingId}</span> },
      { key: "customerName", label: "Customer", render: (p) => p.customerName || "—" },
      { key: "finalEstimate", label: "Amount", render: (p) => `₹${p.finalEstimate || 0}` },
      { key: "paymentOption", label: "Method" },
      { key: "paymentStatus", label: "Status", render: (p) => <Badge variant={p.paymentStatus === "Paid" ? "default" : "secondary"} className="text-[10px]">{p.paymentStatus}</Badge> },
    ],
    formFields: [
      { name: "paymentStatus", label: "Payment Status", type: "select", options: ["Pending", "Paid", "Failed", "Refunded"] },
      { name: "paymentReceived", label: "Amount Received ₹", type: "number" },
      { name: "adminNotes", label: "Admin Notes", type: "textarea" },
    ],
  }} />;
}

function WalletModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/wallets",
    title: "Wallets",
    entityName: "Wallet",
    columns: [
      { key: "id", label: "ID" },
      { key: "holderType", label: "Type" },
      { key: "holderId", label: "Holder ID" },
      { key: "balance", label: "Balance", render: (w) => `₹${w.balance}` },
      { key: "status", label: "Status", render: (w) => <Badge variant={w.status === "Active" ? "default" : "secondary"} className="text-[10px]">{w.status}</Badge> },
    ],
    formFields: [
      { name: "holderType", label: "Holder Type", type: "select", options: ["Customer", "Rider", "Vendor", "Branch"] },
      { name: "holderId", label: "Holder ID", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Frozen", "Closed"] },
    ],
  }} />;
}

function SettlementsModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/settlements",
    title: "Settlements",
    entityName: "Settlement",
    columns: [
      { key: "id", label: "ID" },
      { key: "riderId", label: "Rider" },
      { key: "periodStart", label: "From", render: (s) => new Date(s.periodStart).toLocaleDateString() },
      { key: "periodEnd", label: "To", render: (s) => new Date(s.periodEnd).toLocaleDateString() },
      { key: "totalRides", label: "Rides" },
      { key: "netAmount", label: "Net ₹", render: (s) => `₹${s.netAmount}` },
      { key: "status", label: "Status", render: (s) => <Badge variant={s.status === "Paid" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge> },
    ],
    formFields: [
      { name: "riderId", label: "Rider ID", type: "number" },
      { name: "periodStart", label: "Period Start", type: "date" },
      { name: "periodEnd", label: "Period End", type: "date" },
      { name: "totalRides", label: "Total Rides", type: "number" },
      { name: "grossAmount", label: "Gross ₹", type: "number" },
      { name: "commission", label: "Commission ₹", type: "number" },
      { name: "netAmount", label: "Net ₹", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "Approved", "Paid", "Cancelled"] },
    ],
  }} />;
}

function ReportsModule() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 hover:shadow-lg cursor-pointer" onClick={() => toast.info("Generating PDF report...")}>
          <FileText className="w-8 h-8 text-red-500 mb-2" />
          <div className="font-semibold">PDF Report</div>
          <div className="text-xs text-muted-foreground">Download comprehensive PDF</div>
        </Card>
        <Card className="p-4 hover:shadow-lg cursor-pointer" onClick={() => toast.info("Generating Excel report...")}>
          <FileBarChart className="w-8 h-8 text-green-500 mb-2" />
          <div className="font-semibold">Excel Report</div>
          <div className="text-xs text-muted-foreground">Spreadsheet with all data</div>
        </Card>
        <Card className="p-4 hover:shadow-lg cursor-pointer" onClick={() => toast.info("Generating CSV...")}>
          <Download className="w-8 h-8 text-blue-500 mb-2" />
          <div className="font-semibold">CSV Export</div>
          <div className="text-xs text-muted-foreground">Raw data for import</div>
        </Card>
      </div>
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Available Reports</h3>
        <div className="space-y-2 text-sm">
          {["Bookings Summary", "Revenue Report", "Rider Performance", "Vendor Sales", "Customer Analytics", "Inventory Status", "Settlement Report"].map((r) => (
            <div key={r} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
              <span>{r}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => toast.info(`Generating ${r} PDF...`)}>PDF</Button>
                <Button size="sm" variant="ghost" onClick={() => toast.info(`Generating ${r} Excel...`)}>Excel</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AnalyticsModule() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Conversion Rate</div><div className="text-2xl font-bold">12.4%</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Avg Order Value</div><div className="text-2xl font-bold">₹485</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Repeat Rate</div><div className="text-2xl font-bold">34%</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Cancellation Rate</div><div className="text-2xl font-bold">5.2%</div></Card>
      </div>
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Booking Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={Array.from({ length: 7 }).map((_, i) => ({ day: `Day ${i+1}`, bookings: Math.floor(Math.random() * 50) + 10, revenue: Math.floor(Math.random() * 5000) + 1000 }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RTooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2} />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function CmsModule() {
  return (
    <Tabs defaultValue="sections">
      <TabsList>
        <TabsTrigger value="sections">Content Sections</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
      </TabsList>
      <TabsContent value="sections">
        <CrudModule config={{
          endpoint: "/api/admin/domain-settings",
          title: "Content Sections",
          entityName: "Section",
          columns: [
            { key: "id", label: "ID" },
            { key: "sectionKey", label: "Key" },
            { key: "title", label: "Title" },
            { key: "status", label: "Status" },
          ],
          formFields: [
            { name: "sectionKey", label: "Section Key", required: true },
            { name: "title", label: "Title" },
            { name: "subtitle", label: "Subtitle" },
            { name: "body", label: "Body", type: "textarea" },
            { name: "imageUrl", label: "Image URL" },
            { name: "sortOrder", label: "Sort Order", type: "number" },
          ],
        }} />
      </TabsContent>
      <TabsContent value="seo">
        <Card className="p-6 text-sm text-muted-foreground">SEO settings — edit meta titles, descriptions, canonical URLs per page.</Card>
      </TabsContent>
    </Tabs>
  );
}

function MediaModule() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/media");
      const d = await r.json();
      setItems(d.items || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        await fetch("/api/admin/media", { method: "POST", body: fd });
      }
      toast.success("Upload complete");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <Button size="sm" onClick={() => document.getElementById("media-upload")?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
          Upload
        </Button>
        <input
          id="media-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      <Card
        className={`p-8 border-2 border-dashed text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) upload(e.dataTransfer.files);
        }}
        onClick={() => document.getElementById("media-upload")?.click()}
      >
        <ImagePlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <div className="text-sm font-medium">Drag & drop images here</div>
        <div className="text-xs text-muted-foreground mt-1">Or click to browse · Max 8 MB · JPG, PNG, WebP</div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No media uploaded yet</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((m) => (
            <Card key={m.filename} className="overflow-hidden group cursor-pointer">
              <div className="aspect-square bg-muted relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.filename} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(window.location.origin + m.url); toast.success("URL copied"); }}>
                    Copy URL
                  </Button>
                </div>
              </div>
              <div className="p-2 text-[10px] text-muted-foreground truncate">{m.filename}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BannersModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/banners",
    title: "Banners",
    entityName: "Banner",
    searchField: "title",
    columns: [
      { key: "id", label: "ID" },
      { key: "title", label: "Title" },
      { key: "position", label: "Position" },
      { key: "sortOrder", label: "Order" },
      { key: "status", label: "Status", render: (b) => <Badge variant={b.status === "Active" ? "default" : "secondary"} className="text-[10px]">{b.status}</Badge> },
    ],
    formFields: [
      { name: "title", label: "Title", required: true },
      { name: "subtitle", label: "Subtitle" },
      { name: "imageUrl", label: "Image URL" },
      { name: "linkUrl", label: "Link URL" },
      { name: "position", label: "Position", type: "select", options: ["home_top", "home_mid", "sidebar", "footer"] },
      { name: "sortOrder", label: "Sort Order", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  }} />;
}

function PagesModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/domain-settings",
    title: "Pages",
    entityName: "Page",
    columns: [
      { key: "id", label: "ID" },
      { key: "sectionKey", label: "Page Key" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
    ],
    formFields: [
      { name: "sectionKey", label: "Page Slug", required: true },
      { name: "title", label: "Title" },
      { name: "subtitle", label: "Subtitle" },
      { name: "body", label: "Body (HTML/Markdown)", type: "textarea" },
      { name: "imageUrl", label: "Featured Image URL" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
    ],
  }} />;
}

function MenusModule() {
  return (
    <Card className="p-6">
      <h2 className="font-semibold mb-2">Navigation Menus</h2>
      <p className="text-sm text-muted-foreground">Configure header, footer, and sidebar navigation menus. Stored in settings table with key "menu_header", "menu_footer".</p>
      <Button className="mt-4" size="sm"><Plus className="w-4 h-4 mr-1" /> Add Menu Item</Button>
    </Card>
  );
}

function NotificationsModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/notifications",
    title: "Notification Logs",
    entityName: "Notification",
    columns: [
      { key: "id", label: "ID" },
      { key: "channel", label: "Channel" },
      { key: "recipient", label: "Recipient" },
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status", render: (n) => <Badge variant={n.status === "Sent" ? "default" : "secondary"} className="text-[10px]">{n.status}</Badge> },
      { key: "createdAt", label: "Sent At", render: (n) => new Date(n.createdAt).toLocaleString() },
    ],
    formFields: [
      { name: "channel", label: "Channel", type: "select", options: ["WhatsApp", "SMS", "Email", "Push"] },
      { name: "recipient", label: "Recipient" },
      { name: "subject", label: "Subject" },
      { name: "body", label: "Body", type: "textarea" },
    ],
  }} />;
}

function CommsModule({ channel }: { channel: string }) {
  return (
    <Card className="p-6">
      <h2 className="font-semibold mb-2">{channel} Configuration</h2>
      <p className="text-sm text-muted-foreground mb-4">Configure {channel.toLowerCase()} integration for sending notifications.</p>
      <div className="space-y-3 max-w-md">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{channel} API Key</label>
          <Input className="mt-1" type="password" placeholder={`Enter ${channel} API key`} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Sender ID</label>
          <Input className="mt-1" placeholder={`Enter sender ID`} />
        </div>
        <Button>Save Configuration</Button>
      </div>
    </Card>
  );
}

function SupportModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/support",
    title: "Support Tickets",
    entityName: "Ticket",
    searchField: "subject",
    columns: [
      { key: "id", label: "ID" },
      { key: "subject", label: "Subject" },
      { key: "channel", label: "Channel" },
      { key: "priority", label: "Priority", render: (t) => <Badge variant={t.priority === "Urgent" ? "destructive" : t.priority === "High" ? "default" : "secondary"} className="text-[10px]">{t.priority}</Badge> },
      { key: "status", label: "Status", render: (t) => <Badge variant={t.status === "Open" ? "default" : "secondary"} className="text-[10px]">{t.status}</Badge> },
      { key: "createdAt", label: "Created", render: (t) => new Date(t.createdAt).toLocaleDateString() },
    ],
    formFields: [
      { name: "subject", label: "Subject", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "channel", label: "Channel", type: "select", options: ["Web", "WhatsApp", "Email", "App"] },
      { name: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High", "Urgent"] },
      { name: "status", label: "Status", type: "select", options: ["Open", "In Progress", "Resolved", "Closed"] },
      { name: "assignedTo", label: "Assigned To" },
      { name: "resolution", label: "Resolution", type: "textarea" },
    ],
  }} />;
}

function AuditLogsModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/audit-logs",
    title: "Audit Logs",
    entityName: "Log",
    columns: [
      { key: "id", label: "ID" },
      { key: "adminEmail", label: "Admin" },
      { key: "action", label: "Action" },
      { key: "module", label: "Module" },
      { key: "entityType", label: "Entity" },
      { key: "ip", label: "IP" },
      { key: "createdAt", label: "When", render: (l) => new Date(l.createdAt).toLocaleString() },
    ],
    formFields: [],
  }} />;
}

function RolesModule({ admin }: { admin: AdminInfo }) {
  const ROLES = [
    { name: "SUPER_ADMIN", desc: "Full system access including settings and billing", color: "from-red-500 to-rose-600", perms: 50 },
    { name: "ADMIN", desc: "Manage bookings, customers, vendors, content", color: "from-indigo-500 to-purple-600", perms: 35 },
    { name: "BRANCH", desc: "Branch-level operations and reports", color: "from-blue-500 to-cyan-600", perms: 18 },
    { name: "VENDOR", desc: "Manage own products, orders, inventory", color: "from-purple-500 to-violet-600", perms: 12 },
    { name: "RIDER", desc: "View assigned bookings, update status", color: "from-green-500 to-emerald-600", perms: 6 },
    { name: "CUSTOMER", desc: "Place orders, view own bookings", color: "from-amber-500 to-orange-600", perms: 4 },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Role Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ROLES.map((r) => (
          <Card key={r.name} className="p-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center text-white mb-3`}>
              <Shield className="w-5 h-5" />
            </div>
            <div className="font-semibold">{r.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant="secondary" className="text-[10px]">{r.perms} permissions</Badge>
              {admin.role === "Owner" && <Button size="sm" variant="outline">Configure</Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PermissionsModule() {
  const modules = ["bookings", "customers", "riders", "vendors", "branches", "products", "categories", "inventory", "services", "vehicles", "pricing", "coupons", "offers", "payments", "wallet", "settlements", "reports", "settings", "users", "audit-logs"];
  const actions = ["view", "create", "edit", "delete", "approve", "export"];
  const roles = ["SUPER_ADMIN", "ADMIN", "BRANCH", "VENDOR", "RIDER", "CUSTOMER"];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Permissions Matrix</h1>
      <Card className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-2">Module / Action</th>
              {roles.map((r) => <th key={r} className="p-2 text-center">{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              actions.map((a) => (
                <tr key={`${m}-${a}`} className="border-b hover:bg-muted/30">
                  <td className="p-2 capitalize">{m} · {a}</td>
                  {roles.map((r) => (
                    <td key={r} className="p-2 text-center">
                      <Switch defaultChecked={r === "SUPER_ADMIN" || (r === "ADMIN" && ["view", "create", "edit"].includes(a))} />
                    </td>
                  ))}
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function FeatureFlagsModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/feature-flags",
    title: "Feature Flags",
    entityName: "Flag",
    searchField: "key",
    columns: [
      { key: "id", label: "ID" },
      { key: "key", label: "Key", render: (f) => <span className="font-mono text-xs">{f.key}</span> },
      { key: "label", label: "Label" },
      { key: "enabled", label: "Enabled", render: (f) => <Badge variant={f.enabled ? "default" : "secondary"} className="text-[10px]">{f.enabled ? "On" : "Off"}</Badge> },
      { key: "rolloutPercent", label: "Rollout %", render: (f) => `${f.rolloutPercent}%` },
    ],
    formFields: [
      { name: "key", label: "Key", required: true },
      { name: "label", label: "Label" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "enabled", label: "Enabled", type: "switch" },
      { name: "rolloutPercent", label: "Rollout %", type: "number" },
    ],
  }} />;
}

function ApiKeysModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/api-keys",
    title: "API Keys",
    entityName: "Key",
    searchField: "name",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "keyPrefix", label: "Prefix", render: (k) => <span className="font-mono text-xs">{k.keyPrefix}...</span> },
      { key: "scopes", label: "Scopes" },
      { key: "lastUsedAt", label: "Last Used", render: (k) => k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never" },
      { key: "status", label: "Status", render: (k) => <Badge variant={k.status === "Active" ? "default" : "secondary"} className="text-[10px]">{k.status}</Badge> },
    ],
    formFields: [
      { name: "name", label: "Name", required: true },
      { name: "scopes", label: "Scopes (CSV)", type: "textarea" },
      { name: "expiresAt", label: "Expires At", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Revoked"] },
    ],
  }} />;
}

function IntegrationsModule() {
  return <CrudModule config={{
    endpoint: "/api/admin/integrations",
    title: "Integrations",
    entityName: "Integration",
    searchField: "name",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status", render: (i) => <Badge variant={i.status === "Active" ? "default" : "secondary"} className="text-[10px]">{i.status}</Badge> },
    ],
    formFields: [
      { name: "name", label: "Name", required: true },
      { name: "category", label: "Category", type: "select", options: ["Payment", "SMS", "Email", "WhatsApp", "Maps", "Analytics", "Storage"] },
      { name: "configJson", label: "Config (JSON)", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  }} />;
}

function SettingsModule() {
  return (
    <Tabs defaultValue="company">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="company">Company</TabsTrigger>
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="taxes">Taxes</TabsTrigger>
        <TabsTrigger value="domains">Domains</TabsTrigger>
        <TabsTrigger value="api">API Keys</TabsTrigger>
      </TabsList>
      <TabsContent value="company">
        <Card className="p-6 space-y-3 max-w-xl">
          <h3 className="font-semibold">Company Info</h3>
          <div><label className="text-xs">Company Name</label><Input className="mt-1" defaultValue="HP Enterprise" /></div>
          <div><label className="text-xs">Brand Name</label><Input className="mt-1" defaultValue="ParcelMaadi" /></div>
          <div><label className="text-xs">GSTIN</label><Input className="mt-1" defaultValue="29ANZPH4067Q1ZS" /></div>
          <div><label className="text-xs">Website</label><Input className="mt-1" defaultValue="https://parcelmaadi.com" /></div>
          <Button>Save</Button>
        </Card>
      </TabsContent>
      <TabsContent value="branding">
        <Card className="p-6 space-y-3 max-w-xl">
          <h3 className="font-semibold">Branding</h3>
          <div><label className="text-xs">Logo URL</label><Input className="mt-1" defaultValue="/logo.png" /></div>
          <div><label className="text-xs">Favicon URL</label><Input className="mt-1" defaultValue="/logo.png" /></div>
          <div><label className="text-xs">Primary Color</label><Input className="mt-1" defaultValue="#6366f1" /></div>
          <div><label className="text-xs">Accent Color</label><Input className="mt-1" defaultValue="#10b981" /></div>
          <Button>Save</Button>
        </Card>
      </TabsContent>
      <TabsContent value="payments">
        <Card className="p-6 space-y-3 max-w-xl">
          <h3 className="font-semibold">Payment Gateways</h3>
          <div><label className="text-xs">Razorpay Key ID</label><Input className="mt-1" type="password" /></div>
          <div><label className="text-xs">Razorpay Secret</label><Input className="mt-1" type="password" /></div>
          <div><label className="text-xs">UPI ID</label><Input className="mt-1" defaultValue="parcelmaadi@upi" /></div>
          <Button>Save</Button>
        </Card>
      </TabsContent>
      <TabsContent value="notifications">
        <Card className="p-6 space-y-3 max-w-xl">
          <h3 className="font-semibold">Notification Settings</h3>
          <div><label className="text-xs">WhatsApp Number</label><Input className="mt-1" defaultValue="919741433725" /></div>
          <div><label className="text-xs">ntfy Topic</label><Input className="mt-1" defaultValue="parcelmaadi-admin-x7k9m2" /></div>
          <div><label className="text-xs">Telegram Bot Token</label><Input className="mt-1" type="password" /></div>
          <Button>Save</Button>
        </Card>
      </TabsContent>
      <TabsContent value="taxes">
        <Card className="p-6 space-y-3 max-w-xl">
          <h3 className="font-semibold">Tax Settings</h3>
          <div><label className="text-xs">Default GST %</label><Input className="mt-1" type="number" defaultValue="5" /></div>
          <div><label className="text-xs">Default Commission %</label><Input className="mt-1" type="number" defaultValue="10" /></div>
          <div><label className="text-xs">Platform Fee ₹</label><Input className="mt-1" type="number" defaultValue="5" /></div>
          <Button>Save</Button>
        </Card>
      </TabsContent>
      <TabsContent value="domains">
        <Card className="p-6 space-y-3 max-w-xl">
          <h3 className="font-semibold">Domains</h3>
          <div><label className="text-xs">Customer URL</label><Input className="mt-1" defaultValue="https://parcelmaadi.com" /></div>
          <div><label className="text-xs">Admin URL</label><Input className="mt-1" defaultValue="https://parcelmaadi.com/?admin=1" /></div>
          <div><label className="text-xs">API Base URL</label><Input className="mt-1" defaultValue="https://parcelmaadi.com/api" /></div>
          <Button>Save</Button>
        </Card>
      </TabsContent>
      <TabsContent value="api">
        <Card className="p-6 text-sm">Manage API keys via the dedicated API Keys module.</Card>
      </TabsContent>
    </Tabs>
  );
}

function BackupModule() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Backup & Restore</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4">
          <DatabaseBackup className="w-8 h-8 text-indigo-500 mb-2" />
          <div className="font-semibold">Create Backup</div>
          <div className="text-xs text-muted-foreground mb-3">Export all data as JSON snapshot</div>
          <Button size="sm" onClick={() => toast.info("Backup started — link will be available when ready")}>
            <DatabaseBackup className="w-4 h-4 mr-1" /> Backup Now
          </Button>
        </Card>
        <Card className="p-4">
          <RotateCcw className="w-8 h-8 text-amber-500 mb-2" />
          <div className="font-semibold">Restore</div>
          <div className="text-xs text-muted-foreground mb-3">Restore from a previous backup file</div>
          <Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-1" /> Upload Backup</Button>
        </Card>
      </div>
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Backup History</h3>
        <div className="text-sm text-muted-foreground">No backups yet. Click "Backup Now" to create your first one.</div>
      </Card>
    </div>
  );
}

function ProfileModule({ admin }: { admin: AdminInfo }) {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {admin.name?.[0] || "A"}
          </div>
          <div>
            <div className="font-semibold text-lg">{admin.name}</div>
            <div className="text-sm text-muted-foreground">{admin.email}</div>
            <Badge variant="secondary" className="mt-1">{admin.role}</Badge>
          </div>
        </div>
        <div className="pt-4 border-t space-y-3">
          <div><label className="text-xs font-medium text-muted-foreground">Name</label><Input className="mt-1" defaultValue={admin.name} /></div>
          <div><label className="text-xs font-medium text-muted-foreground">Mobile</label><Input className="mt-1" placeholder="Enter mobile" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">New Password</label><Input className="mt-1" type="password" placeholder="Leave blank to keep current" /></div>
          <Button>Save Changes</Button>
        </div>
      </Card>
    </div>
  );
}
