(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Shared API client + types for ParcelMaadi frontend
__turbopack_context__.s([
    "ADMIN_ROLES",
    ()=>ADMIN_ROLES,
    "ORDER_STATUS_OPTIONS",
    ()=>ORDER_STATUS_OPTIONS,
    "PAYMENT_STATUS_OPTIONS",
    ()=>PAYMENT_STATUS_OPTIONS,
    "SERVICE_STATUS_OPTIONS",
    ()=>SERVICE_STATUS_OPTIONS,
    "api",
    ()=>api
]);
const ORDER_STATUS_OPTIONS = [
    "Pending",
    "Confirmed",
    "Driver Assigned",
    "Pickup Started",
    "Picked Up",
    "In Progress",
    "Delivered",
    "Completed",
    "Cancelled"
];
const PAYMENT_STATUS_OPTIONS = [
    "Pending",
    "Advance Paid",
    "Full Paid",
    "Cash",
    "Failed",
    "Verified",
    "Refund Required"
];
const SERVICE_STATUS_OPTIONS = [
    "Active",
    "Coming Soon",
    "Hidden",
    "Delayed",
    "Manual Quote Only"
];
const ADMIN_ROLES = [
    "Owner",
    "Operations",
    "Accounts",
    "View"
];
async function jsonFetch(url, init) {
    const r = await fetch(url, {
        ...init,
        headers: {
            ...init?.body && !(init?.body instanceof FormData) ? {
                "Content-Type": "application/json"
            } : {},
            ...init?.headers || {}
        },
        cache: "no-store"
    });
    if (!r.ok) {
        let msg = `Request failed (${r.status})`;
        try {
            const j = await r.json();
            msg = j.error || msg;
        } catch  {}
        throw new Error(msg);
    }
    return r.json();
}
const api = {
    // public
    getPublic: ()=>jsonFetch("/api/public/settings"),
    getServices: ()=>jsonFetch("/api/public/services"),
    getServiceItems: (id)=>jsonFetch(`/api/public/services/${id}/items`),
    getProducts: ()=>jsonFetch("/api/public/products"),
    publicShops: (type)=>jsonFetch(type ? `/api/public/shops?type=${type}` : "/api/public/shops"),
    reverseGeocode: (lat, lng)=>jsonFetch("/api/location/reverse-geocode", {
            method: "POST",
            body: JSON.stringify({
                lat,
                lng
            })
        }),
    distance: (data)=>jsonFetch("/api/location/distance", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    fareEstimate: (data)=>jsonFetch("/api/fare/estimate", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    fareCards: (serviceId, distanceKm, opts)=>jsonFetch("/api/fare/estimate", {
            method: "POST",
            body: JSON.stringify({
                serviceId,
                distanceKm,
                ...opts
            })
        }),
    fareEstimateOpts: (data)=>jsonFetch("/api/fare/estimate", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    materialShops: (vehicleSlug, quantity, deliveryLat, deliveryLng)=>jsonFetch(`/api/material/shops?vehicleSlug=${vehicleSlug}&quantity=${quantity}${deliveryLat != null ? `&deliveryLat=${deliveryLat}&deliveryLng=${deliveryLng}` : ""}`),
    createBooking: (data)=>jsonFetch("/api/bookings", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    getBooking: (bookingId)=>jsonFetch(`/api/bookings/${bookingId}`),
    getMyBookings: (mobile)=>jsonFetch(`/api/bookings?mobile=${encodeURIComponent(mobile)}`),
    cancelBooking: (bookingId)=>jsonFetch(`/api/bookings/${bookingId}/cancel`, {
            method: "POST"
        }),
    editBooking: (bookingId, data)=>jsonFetch(`/api/bookings/${bookingId}/edit`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    uploadScreenshot: (bookingId, file)=>{
        const fd = new FormData();
        fd.append("bookingId", bookingId);
        fd.append("file", file);
        return jsonFetch("/api/payments/upload-screenshot", {
            method: "POST",
            body: fd
        });
    },
    // admin
    adminLogin: (email, password)=>jsonFetch("/api/admin/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        }),
    adminLogout: ()=>jsonFetch("/api/admin/logout", {
            method: "POST"
        }),
    adminMe: ()=>jsonFetch("/api/admin/me"),
    adminDashboard: ()=>jsonFetch("/api/admin/dashboard"),
    adminBookings: (status, q)=>jsonFetch(`/api/admin/bookings?${new URLSearchParams({
            ...status && status !== "all" ? {
                status
            } : {},
            ...q ? {
                q
            } : {}
        })}`),
    adminUpdateBookingStatus: (id, status, notes)=>jsonFetch(`/api/admin/bookings/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                status,
                notes
            })
        }),
    adminAssignDriver: (id, driverName, driverMobile, driverType)=>jsonFetch(`/api/admin/bookings/${id}/assign-driver`, {
            method: "PATCH",
            body: JSON.stringify({
                driverName,
                driverMobile,
                driverType
            })
        }),
    adminUpdatePayment: (id, data)=>jsonFetch(`/api/admin/bookings/${id}/payment`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminInvoice: (id)=>jsonFetch(`/api/admin/bookings/${id}/invoice`),
    adminExportBookings: (format, status)=>{
        const url = `/api/admin/bookings/export?format=${format}${status && status !== "all" ? `&status=${status}` : ""}`;
        return fetch(url, {
            credentials: "include"
        });
    },
    adminClearDemo: ()=>jsonFetch("/api/admin/bookings/clear-demo", {
            method: "POST"
        }),
    adminPriceMaster: ()=>jsonFetch("/api/admin/price-master"),
    adminCreatePrice: (data)=>jsonFetch("/api/admin/price-master", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    adminUpdatePrice: (id, data)=>jsonFetch(`/api/admin/price-master/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminDeletePrice: (id)=>jsonFetch(`/api/admin/price-master/${id}`, {
            method: "DELETE"
        }),
    adminServices: ()=>jsonFetch("/api/admin/services"),
    adminCreateService: (data)=>jsonFetch("/api/admin/services", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    adminUpdateService: (id, data)=>jsonFetch(`/api/admin/services/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminDeleteService: (id)=>jsonFetch(`/api/admin/services/${id}`, {
            method: "DELETE"
        }),
    adminVehicles: ()=>jsonFetch("/api/admin/vehicles"),
    adminCreateVehicle: (data)=>jsonFetch("/api/admin/vehicles", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    adminUpdateVehicle: (id, data)=>jsonFetch(`/api/admin/vehicles/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminDeleteVehicle: (id)=>jsonFetch(`/api/admin/vehicles/${id}`, {
            method: "DELETE"
        }),
    adminUsers: ()=>jsonFetch("/api/admin/users"),
    adminCreateUser: (data)=>jsonFetch("/api/admin/users", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    adminUpdateUser: (id, data)=>jsonFetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminDeleteUser: (id)=>jsonFetch(`/api/admin/users/${id}`, {
            method: "DELETE"
        }),
    adminChangePassword: (currentPassword, newPassword)=>jsonFetch("/api/admin/change-password", {
            method: "POST",
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        }),
    adminZones: ()=>jsonFetch("/api/admin/zones"),
    adminCreateZone: (data)=>jsonFetch("/api/admin/zones", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    adminUpdateZone: (id, data)=>jsonFetch(`/api/admin/zones/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminDeleteZone: (id)=>jsonFetch(`/api/admin/zones/${id}`, {
            method: "DELETE"
        }),
    adminCoupons: ()=>jsonFetch("/api/admin/coupons"),
    adminCreateCoupon: (data)=>jsonFetch("/api/admin/coupons", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    adminUpdateCoupon: (id, data)=>jsonFetch(`/api/admin/coupons/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminDeleteCoupon: (id)=>jsonFetch(`/api/admin/coupons/${id}`, {
            method: "DELETE"
        }),
    validateCoupon: (code, orderAmount)=>jsonFetch("/api/admin/coupons/validate", {
            method: "POST",
            body: JSON.stringify({
                code,
                orderAmount
            })
        }),
    adminReports: (period, from, to)=>jsonFetch(`/api/admin/reports?period=${period}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`),
    adminSuppliers: ()=>jsonFetch("/api/admin/suppliers"),
    adminCreateSupplier: (data)=>jsonFetch("/api/admin/suppliers", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    adminUpdateSupplier: (id, data)=>jsonFetch(`/api/admin/suppliers/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminDeleteSupplier: (id)=>jsonFetch(`/api/admin/suppliers/${id}`, {
            method: "DELETE"
        }),
    adminProducts: ()=>jsonFetch("/api/admin/products"),
    adminCreateProduct: (data)=>jsonFetch("/api/admin/products", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    adminUpdateProduct: (id, data)=>jsonFetch(`/api/admin/products/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminDeleteProduct: (id)=>jsonFetch(`/api/admin/products/${id}`, {
            method: "DELETE"
        }),
    adminSettings: ()=>jsonFetch("/api/admin/settings"),
    adminUpdateSettings: (data)=>jsonFetch("/api/admin/settings", {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminDomain: ()=>jsonFetch("/api/admin/domain-settings"),
    adminUpdateDomain: (data)=>jsonFetch("/api/admin/domain-settings", {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    publicApks: ()=>jsonFetch("/api/public/apks"),
    adminApks: ()=>jsonFetch("/api/admin/apks"),
    adminCreateApk: (data)=>jsonFetch("/api/admin/apks", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    adminUpdateApk: (id, data)=>jsonFetch(`/api/admin/apks/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    adminDeleteApk: (id)=>jsonFetch(`/api/admin/apks/${id}`, {
            method: "DELETE"
        }),
    adminSeed: ()=>jsonFetch("/api/admin/seed", {
            method: "POST"
        })
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/cart.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartProvider",
    ()=>CartProvider,
    "useCart",
    ()=>useCart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const CartContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function CartProvider({ children }) {
    _s();
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const addItem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CartProvider.useCallback[addItem]": (item, qty = 1)=>{
            setItems({
                "CartProvider.useCallback[addItem]": (prev)=>{
                    const existing = prev.find({
                        "CartProvider.useCallback[addItem].existing": (i)=>i.id === item.id
                    }["CartProvider.useCallback[addItem].existing"]);
                    if (existing) {
                        return prev.map({
                            "CartProvider.useCallback[addItem]": (i)=>i.id === item.id ? {
                                    ...i,
                                    quantity: i.quantity + qty
                                } : i
                        }["CartProvider.useCallback[addItem]"]);
                    }
                    return [
                        ...prev,
                        {
                            ...item,
                            quantity: qty
                        }
                    ];
                }
            }["CartProvider.useCallback[addItem]"]);
            setIsOpen(true);
        }
    }["CartProvider.useCallback[addItem]"], []);
    const removeItem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CartProvider.useCallback[removeItem]": (id)=>{
            setItems({
                "CartProvider.useCallback[removeItem]": (prev)=>prev.filter({
                        "CartProvider.useCallback[removeItem]": (i)=>i.id !== id
                    }["CartProvider.useCallback[removeItem]"])
            }["CartProvider.useCallback[removeItem]"]);
        }
    }["CartProvider.useCallback[removeItem]"], []);
    const updateQty = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CartProvider.useCallback[updateQty]": (id, qty)=>{
            if (qty <= 0) {
                setItems({
                    "CartProvider.useCallback[updateQty]": (prev)=>prev.filter({
                            "CartProvider.useCallback[updateQty]": (i)=>i.id !== id
                        }["CartProvider.useCallback[updateQty]"])
                }["CartProvider.useCallback[updateQty]"]);
                return;
            }
            setItems({
                "CartProvider.useCallback[updateQty]": (prev)=>prev.map({
                        "CartProvider.useCallback[updateQty]": (i)=>i.id === id ? {
                                ...i,
                                quantity: qty
                            } : i
                    }["CartProvider.useCallback[updateQty]"])
            }["CartProvider.useCallback[updateQty]"]);
        }
    }["CartProvider.useCallback[updateQty]"], []);
    const clearCart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CartProvider.useCallback[clearCart]": ()=>setItems([])
    }["CartProvider.useCallback[clearCart]"], []);
    const total = items.reduce((s, i)=>s + i.price * i.quantity, 0);
    const count = items.reduce((s, i)=>s + i.quantity, 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CartContext.Provider, {
        value: {
            items,
            addItem,
            removeItem,
            updateQty,
            clearCart,
            total,
            count,
            isOpen,
            setIsOpen
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/lib/cart.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
_s(CartProvider, "60IStU8cVD7aJmcEl2ykqS+U384=");
_c = CartProvider;
function useCart() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}
_s1(useCart, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "CartProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$customer$2d$app$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/customer-app.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2d$app$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin-app.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cart$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cart.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function Home() {
    _s();
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("customer");
    if (view === "admin") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2d$app$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdminApp"], {
            onExit: ()=>setView("customer")
        }, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 11,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cart$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CartProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$customer$2d$app$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CustomerApp"], {
            onOpenAdmin: ()=>setView("admin")
        }, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 16,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
_s(Home, "EJH4sMZlOEy0adfwJAFZTBMFdV0=");
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_0y0jit9._.js.map