// Shared API client + types for ParcelMaadi frontend
export interface Service {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
  status: string;
  sortOrder: number;
  vehicles?: Vehicle[];
  startingPriceText?: string;
}
export interface Vehicle {
  id: number;
  serviceId: number;
  name: string;
  slug?: string | null;
  maxLoad: string | null;
  imageUrl: string | null;
  recommendedUse?: string | null;
  status: string;
  sortOrder: number;
}
export interface PriceMaster {
  id: number;
  serviceId: number;
  vehicleId: number | null;
  supplierId?: number | null;
  itemType: string | null;
  pricingType?: string;
  unitType?: string | null;
  perUnitRate?: number;
  minimumKm: number;
  minimumFare: number;
  perKmRate: number;
  slabJson: string;
  loadingCharge: number;
  waitingCharge: number;
  helperCharge: number;
  nightChargePercent: number;
  expressChargePercent: number;
  extraCharge: number;
  discountPercent: number;
  gstPercent: number;
  advancePercent: number;
  minimumBooking: number;
  commissionPercent: number;
  roundTripMultiplier?: number;
  rushSurchargePercent?: number;
  notes: string | null;
  status: string;
  service?: Service;
  vehicle?: Vehicle | null;
  supplier?: any;
}
export interface FareBreakup {
  baseFare: number;
  distanceCharge: number;
  loadingCharge: number;
  waitingCharge: number;
  helperCharge: number;
  nightCharge: number;
  expressCharge: number;
  extraCharge: number;
  tollParking: number;
  gst: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  finalEstimate: number;
  advanceAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  manualQuote: boolean;
  calculationNotes: string[];
}
export interface Booking {
  id: number;
  bookingId: string;
  customerId: number;
  serviceId: number;
  vehicleId: number | null;
  pickupAddress: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  pickupMapLink: string | null;
  dropAddress: string | null;
  dropLat: number | null;
  dropLng: number | null;
  dropMapLink: string | null;
  distanceKm: number | null;
  distanceMethod: string | null;
  scheduleDate: string | null;
  scheduleTime: string | null;
  itemDetails: string | null;
  weight: string | null;
  quantity: string | null;
  etaText?: string | null;
  landmark?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  photoUrl?: string | null;
  fareSnapshotJson: string;
  finalEstimate: number;
  discountApplied?: number;
  adminFinalAmount?: number | null;
  paymentReceived?: number;
  paymentOption: string | null;
  paymentStatus: string;
  paymentScreenshotUrl: string | null;
  status: string;
  driverName: string | null;
  driverMobile: string | null;
  driverType?: string | null;
  adminNotes: string | null;
  customerNotes: string | null;
  createdByIp?: string | null;
  createdAt: string;
  service?: Service;
  vehicle?: Vehicle | null;
  customer?: { id: number; name: string; mobile: string; email: string | null };
  statusHistory?: { id: number; oldStatus: string | null; newStatus: string | null; changedBy: string | null; notes: string | null; createdAt: string }[];
  payments?: Payment[];
}
export interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  paymentOption: string | null;
  paymentStatus: string;
  screenshotUrl: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
}
export interface Supplier {
  id: number;
  supplierName: string;
  shopName: string | null;
  mobile: string | null;
  whatsapp: string | null;
  address: string | null;
  mapLocation: string | null;
  supplierType: string | null;
  upiId: string | null;
  qrUrl: string | null;
  serviceArea: string | null;
  commissionPercent: number;
  status: string;
  createdAt: string;
  _count?: { products: number };
}
export interface Product {
  id: number;
  supplierId: number;
  category: string | null;
  productName: string;
  brand: string | null;
  packSize: string | null;
  mrp: number;
  supplierPrice: number;
  sellingPrice: number;
  stock: number;
  photoUrl: string | null;
  status: string;
  createdAt: string;
  supplier?: Supplier;
}
export interface Settings {
  [key: string]: string;
}
export interface ContentSection {
  title: string | null;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
}
export interface PublicData {
  settings: Settings;
  domain: any;
  content: Record<string, ContentSection>;
}

export const ORDER_STATUS_OPTIONS = [
  "Pending", "Confirmed", "Driver Assigned", "Pickup Started", "Picked Up", "In Progress", "Delivered", "Completed", "Cancelled",
];
export const PAYMENT_STATUS_OPTIONS = [
  "Pending", "Advance Paid", "Full Paid", "Cash", "Failed", "Verified", "Refund Required",
];
export const SERVICE_STATUS_OPTIONS = ["Active", "Coming Soon", "Hidden", "Delayed", "Manual Quote Only"];
export const ADMIN_ROLES = ["Owner", "Operations", "Accounts", "View"];

async function jsonFetch(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { ...(init?.body && !(init?.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...(init?.headers || {}) }, cache: "no-store" });
  if (!r.ok) {
    let msg = `Request failed (${r.status})`;
    try { const j = await r.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

export const api = {
  // public
  getPublic: () => jsonFetch("/api/public/settings"),
  getServices: (pincode?: string, city?: string) => jsonFetch(`/api/public/services${pincode || city ? `?${pincode ? `pincode=${encodeURIComponent(pincode)}` : ""}${pincode && city ? "&" : ""}${city ? `city=${encodeURIComponent(city)}` : ""}` : ""}`),
  getServiceItems: (id: number) => jsonFetch(`/api/public/services/${id}/items`),
  getProducts: (pincode?: string, city?: string) => jsonFetch(`/api/public/products${pincode || city ? `?${pincode ? `pincode=${encodeURIComponent(pincode)}` : ""}${pincode && city ? "&" : ""}${city ? `city=${encodeURIComponent(city)}` : ""}` : ""}`),
  publicShops: (type?: string, pincode?: string, city?: string) => jsonFetch(`${"/api/public/shops"}?${type ? `type=${type}` : ""}${type && (pincode || city) ? "&" : ""}${pincode ? `pincode=${encodeURIComponent(pincode)}` : ""}${pincode && city ? "&" : ""}${city ? `city=${encodeURIComponent(city)}` : ""}`),
  reverseGeocode: (lat: number, lng: number) => jsonFetch("/api/location/reverse-geocode", { method: "POST", body: JSON.stringify({ lat, lng }) }),
  distance: (data: any) => jsonFetch("/api/location/distance", { method: "POST", body: JSON.stringify(data) }),
  fareEstimate: (data: any) => jsonFetch("/api/fare/estimate", { method: "POST", body: JSON.stringify(data) }),
  fareCards: (serviceId: number, distanceKm: number, opts?: any) => jsonFetch("/api/fare/estimate", { method: "POST", body: JSON.stringify({ serviceId, distanceKm, ...opts }) }),
  fareEstimateOpts: (data: any) => jsonFetch("/api/fare/estimate", { method: "POST", body: JSON.stringify(data) }),
  materialShops: (vehicleSlug: string, quantity: number, deliveryLat?: number, deliveryLng?: number) => jsonFetch(`/api/material/shops?vehicleSlug=${vehicleSlug}&quantity=${quantity}${deliveryLat != null ? `&deliveryLat=${deliveryLat}&deliveryLng=${deliveryLng}` : ""}`),
  createBooking: (data: any) => jsonFetch("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
  getBooking: (bookingId: string) => jsonFetch(`/api/bookings/${bookingId}`),
  getMyBookings: (mobile: string) => jsonFetch(`/api/bookings?mobile=${encodeURIComponent(mobile)}`),
  cancelBooking: (bookingId: string) => jsonFetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" }),
  editBooking: (bookingId: string, data: any) => jsonFetch(`/api/bookings/${bookingId}/edit`, { method: "PATCH", body: JSON.stringify(data) }),
  uploadScreenshot: (bookingId: string, file: File) => {
    const fd = new FormData();
    fd.append("bookingId", bookingId);
    fd.append("file", file);
    return jsonFetch("/api/payments/upload-screenshot", { method: "POST", body: fd });
  },

  // admin
  adminLogin: (email: string, password: string) => jsonFetch("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  adminLogout: () => jsonFetch("/api/admin/logout", { method: "POST" }),
  adminMe: () => jsonFetch("/api/admin/me"),
  adminDashboard: () => jsonFetch("/api/admin/dashboard"),
  adminBookings: (status?: string, q?: string) => jsonFetch(`/api/admin/bookings?${new URLSearchParams({ ...(status && status !== "all" ? { status } : {}), ...(q ? { q } : {}) })}`),
  adminUpdateBookingStatus: (id: number, status: string, notes?: string) => jsonFetch(`/api/admin/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, notes }) }),
  adminAssignDriver: (id: number, driverName: string, driverMobile: string, driverType?: string) => jsonFetch(`/api/admin/bookings/${id}/assign-driver`, { method: "PATCH", body: JSON.stringify({ driverName, driverMobile, driverType }) }),
  adminUpdatePayment: (id: number, data: any) => jsonFetch(`/api/admin/bookings/${id}/payment`, { method: "PATCH", body: JSON.stringify(data) }),
  adminInvoice: (id: number) => jsonFetch(`/api/admin/bookings/${id}/invoice`),
  adminExportBookings: (format: string, status?: string) => {
    const url = `/api/admin/bookings/export?format=${format}${status && status !== "all" ? `&status=${status}` : ""}`;
    return fetch(url, { credentials: "include" });
  },
  adminClearDemo: () => jsonFetch("/api/admin/bookings/clear-demo", { method: "POST" }),
  adminPriceMaster: () => jsonFetch("/api/admin/price-master"),
  adminCreatePrice: (data: any) => jsonFetch("/api/admin/price-master", { method: "POST", body: JSON.stringify(data) }),
  adminUpdatePrice: (id: number, data: any) => jsonFetch(`/api/admin/price-master/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminDeletePrice: (id: number) => jsonFetch(`/api/admin/price-master/${id}`, { method: "DELETE" }),
  adminServices: () => jsonFetch("/api/admin/services"),
  adminCreateService: (data: any) => jsonFetch("/api/admin/services", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateService: (id: number, data: any) => jsonFetch(`/api/admin/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminDeleteService: (id: number) => jsonFetch(`/api/admin/services/${id}`, { method: "DELETE" }),
  adminVehicles: () => jsonFetch("/api/admin/vehicles"),
  adminCreateVehicle: (data: any) => jsonFetch("/api/admin/vehicles", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateVehicle: (id: number, data: any) => jsonFetch(`/api/admin/vehicles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminDeleteVehicle: (id: number) => jsonFetch(`/api/admin/vehicles/${id}`, { method: "DELETE" }),
  adminUsers: () => jsonFetch("/api/admin/users"),
  adminCreateUser: (data: any) => jsonFetch("/api/admin/users", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateUser: (id: number, data: any) => jsonFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminDeleteUser: (id: number) => jsonFetch(`/api/admin/users/${id}`, { method: "DELETE" }),
  adminChangePassword: (currentPassword: string, newPassword: string) => jsonFetch("/api/admin/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
  adminZones: () => jsonFetch("/api/admin/zones"),
  adminCreateZone: (data: any) => jsonFetch("/api/admin/zones", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateZone: (id: number, data: any) => jsonFetch(`/api/admin/zones/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminDeleteZone: (id: number) => jsonFetch(`/api/admin/zones/${id}`, { method: "DELETE" }),
  adminCoupons: () => jsonFetch("/api/admin/coupons"),
  adminCreateCoupon: (data: any) => jsonFetch("/api/admin/coupons", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateCoupon: (id: number, data: any) => jsonFetch(`/api/admin/coupons/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminDeleteCoupon: (id: number) => jsonFetch(`/api/admin/coupons/${id}`, { method: "DELETE" }),
  validateCoupon: (code: string, orderAmount: number) => jsonFetch("/api/admin/coupons/validate", { method: "POST", body: JSON.stringify({ code, orderAmount }) }),
  adminReports: (period: string, from?: string, to?: string) => jsonFetch(`/api/admin/reports?period=${period}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`),
  adminSuppliers: () => jsonFetch("/api/admin/suppliers"),
  adminCreateSupplier: (data: any) => jsonFetch("/api/admin/suppliers", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateSupplier: (id: number, data: any) => jsonFetch(`/api/admin/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminDeleteSupplier: (id: number) => jsonFetch(`/api/admin/suppliers/${id}`, { method: "DELETE" }),
  adminProducts: () => jsonFetch("/api/admin/products"),
  adminCreateProduct: (data: any) => jsonFetch("/api/admin/products", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateProduct: (id: number, data: any) => jsonFetch(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminDeleteProduct: (id: number) => jsonFetch(`/api/admin/products/${id}`, { method: "DELETE" }),
  adminSettings: () => jsonFetch("/api/admin/settings"),
  adminUpdateSettings: (data: any) => jsonFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify(data) }),
  adminDomain: () => jsonFetch("/api/admin/domain-settings"),
  adminUpdateDomain: (data: any) => jsonFetch("/api/admin/domain-settings", { method: "PATCH", body: JSON.stringify(data) }),
  publicApks: () => jsonFetch("/api/public/apks"),
  adminApks: () => jsonFetch("/api/admin/apks"),
  adminCreateApk: (data: any) => jsonFetch("/api/admin/apks", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateApk: (id: number, data: any) => jsonFetch(`/api/admin/apks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminDeleteApk: (id: number) => jsonFetch(`/api/admin/apks/${id}`, { method: "DELETE" }),
  adminSeed: () => jsonFetch("/api/admin/seed", { method: "POST" }),
};
