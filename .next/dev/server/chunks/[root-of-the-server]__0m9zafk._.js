module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        'error',
        'warn'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/password.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hashPassword",
    ()=>hashPassword,
    "verifyPassword",
    ()=>verifyPassword
]);
// Password hashing utilities (no Next.js dependencies, safe for scripts)
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
function hashPassword(password) {
    const salt = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(16).toString("hex");
    const hash = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const verify = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].scryptSync(password, salt, 64).toString("hex");
    try {
        return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verify, "hex"));
    } catch  {
        return false;
    }
}
}),
"[project]/src/lib/auth.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSession",
    ()=>createSession,
    "destroySession",
    ()=>destroySession,
    "getAdminId",
    ()=>getAdminId,
    "requireAdmin",
    ()=>requireAdmin,
    "roleCan",
    ()=>roleCan
]);
// Lightweight admin session auth using signed httpOnly cookie
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$password$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/password.ts [app-route] (ecmascript)");
;
;
;
;
;
// In production, SESSION_SECRET MUST be set via environment variable.
// In dev, we use a default so local setup doesn't require configuration.
// Note: during `next build` (static analysis), we skip the check to avoid
// build failures — the runtime check happens when the server starts.
const SESSION_SECRET = (()=>{
    if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
    // During build phase, use a placeholder (never used at runtime)
    if (process.env.NEXT_PHASE === "phase-production-build") {
        return "build-time-placeholder-not-used-at-runtime";
    }
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    console.warn("WARNING: Using default SESSION_SECRET for local dev. Set SESSION_SECRET env var for production.");
    return "parcelmaadi-dev-secret-do-not-use-in-production";
})();
const COOKIE_NAME = "pm_admin_session";
// Session timeout — default 60 min (admin-configurable via settings.session_timeout_minutes)
const DEFAULT_SESSION_TIMEOUT_MIN = 60;
function sign(payload) {
    const sig = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    return `${payload}.${sig}`;
}
function verify(token) {
    const idx = token.lastIndexOf(".");
    if (idx < 0) return null;
    const payload = token.slice(0, idx);
    const sig = token.slice(idx + 1);
    const expected = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    if (sig !== expected) return null;
    try {
        const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
        if (Date.now() > decoded.exp) return null;
        return {
            id: String(decoded.id),
            exp: decoded.exp
        };
    } catch  {
        return null;
    }
}
async function createSession(adminId, timeoutMinutes) {
    const min = timeoutMinutes || DEFAULT_SESSION_TIMEOUT_MIN;
    const ttlMs = min * 60 * 1000;
    const payload = Buffer.from(JSON.stringify({
        id: adminId,
        exp: Date.now() + ttlMs,
        iat: Date.now()
    })).toString("base64");
    const token = sign(payload);
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: ttlMs / 1000
    });
}
async function destroySession() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.delete(COOKIE_NAME);
}
async function getAdminId() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const v = verify(token);
    return v?.id || null;
}
async function requireAdmin() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
        return {
            ok: false,
            error: "Unauthorized",
            status: 401
        };
    }
    const v = verify(token);
    if (!v) {
        return {
            ok: false,
            error: "Session expired. Please log in again.",
            status: 401
        };
    }
    const admin = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].adminUser.findUnique({
        where: {
            id: Number(v.id)
        }
    });
    if (!admin || admin.status !== "Active") {
        return {
            ok: false,
            error: "Unauthorized",
            status: 401
        };
    }
    // Read configured timeout from settings, refresh the cookie (sliding window)
    try {
        const s = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].settings.findUnique({
            where: {
                key: "session_timeout_minutes"
            }
        });
        const min = s?.value ? Number(s.value) : DEFAULT_SESSION_TIMEOUT_MIN;
        if (Number.isFinite(min) && min > 0) {
            await createSession(admin.id, min);
        }
    } catch  {}
    return {
        ok: true,
        admin
    };
}
const ROLE_PERMS = {
    Owner: [
        "*"
    ],
    Operations: [
        "dashboard",
        "bookings",
        "price",
        "services",
        "suppliers",
        "products",
        "settings",
        "domain"
    ],
    Accounts: [
        "dashboard",
        "bookings",
        "settings",
        "domain"
    ],
    View: [
        "dashboard",
        "bookings"
    ]
};
function roleCan(role, area) {
    const perms = ROLE_PERMS[role] || [];
    return perms.includes("*") || perms.includes(area);
}
}),
"[project]/src/lib/fare.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ParcelMaadi fare calculation engine
// Formula: Base Fare + Distance Charge + Loading + Waiting + Helper + Night + Express + Extra + Toll/Parking + GST − Discount = Final Estimate
__turbopack_context__.s([
    "DEFAULT_PORTER_BANDS",
    ()=>DEFAULT_PORTER_BANDS,
    "calculateFare",
    ()=>calculateFare,
    "parsePorterBands",
    ()=>parsePorterBands,
    "parseSlabs",
    ()=>parseSlabs
]);
const DEFAULT_PORTER_BANDS = [
    {
        from: 0,
        to: 100,
        percent: 0
    },
    {
        from: 100,
        to: 500,
        percent: 2
    },
    {
        from: 500,
        to: 1000,
        percent: 3
    },
    {
        from: 1000,
        to: 2000,
        percent: 4
    },
    {
        from: 2000,
        to: 5000,
        percent: 5
    },
    {
        from: 5000,
        to: null,
        percent: 6
    }
];
function parsePorterBands(json) {
    if (!json) return DEFAULT_PORTER_BANDS;
    try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch  {}
    return DEFAULT_PORTER_BANDS;
}
function pickPorterDiscount(subtotal, bands) {
    for (const b of bands){
        const to = b.to == null ? Infinity : b.to;
        if (subtotal >= b.from && subtotal < to) return b.percent;
    }
    return 0;
}
function parseSlabs(slabJson) {
    if (!slabJson) return [];
    // Try JSON first
    try {
        const parsed = JSON.parse(slabJson);
        if (Array.isArray(parsed)) {
            return parsed.map((s)=>({
                    from: Number(s.from ?? s.min ?? 0),
                    to: s.to != null ? Number(s.to) : s.max != null ? Number(s.max) : null,
                    rate: Number(s.rate ?? s.price ?? 0)
                }));
        }
    } catch  {
    // not JSON, fall through to text parsing
    }
    // Text parsing: "4-10 km: 12 per km, 11-25 km: 9 per km, 26+ km: 9 per km"
    const slabs = [];
    const parts = slabJson.split(",").map((p)=>p.trim()).filter(Boolean);
    for (const part of parts){
        // match "4-10 km: 12 per km" or "26+ km: 9 per km" or "After 5 km: 25 per km"
        const rangeMatch = part.match(/(\d+)\s*-\s*(\d+)\s*km\s*:\s*(\d+(?:\.\d+)?)/i);
        const plusMatch = part.match(/(\d+)\s*\+\s*km\s*:\s*(\d+(?:\.\d+)?)/i);
        const afterMatch = part.match(/after\s+(\d+)\s*km\s*:\s*(\d+(?:\.\d+)?)/i);
        if (rangeMatch) {
            slabs.push({
                from: Number(rangeMatch[1]),
                to: Number(rangeMatch[2]),
                rate: Number(rangeMatch[3])
            });
        } else if (plusMatch) {
            slabs.push({
                from: Number(plusMatch[1]),
                to: null,
                rate: Number(plusMatch[2])
            });
        } else if (afterMatch) {
            slabs.push({
                from: Number(afterMatch[1]) + 1,
                to: null,
                rate: Number(afterMatch[2])
            });
        }
    }
    return slabs;
}
/**
 * Calculate distance charge using slabs (preferred) or flat perKmRate.
 * - Minimum KM is covered by minimum fare (base fare = minimum fare).
 * - Slab rates apply for KM beyond minimum.
 */ function calculateDistanceCharge(price, distanceKm) {
    const notes = [];
    const slabs = parseSlabs(price.slabJson);
    const minKm = price.minimumKm;
    if (distanceKm <= minKm) {
        return {
            charge: 0,
            notes: [
                `Distance ${distanceKm} km within minimum ${minKm} km — covered by base fare`
            ]
        };
    }
    const chargeableKm = distanceKm - minKm;
    // If slabs exist, use them. Slab ranges are defined as ABSOLUTE km (e.g., 4-10 km).
    // We compute charge for the portion of the journey that falls in each slab, but
    // only for km beyond the minimum.
    if (slabs.length > 0) {
        let total = 0;
        // iterate slabs, compute overlapping km with [minKm, distanceKm]
        for (const slab of slabs){
            const slabFrom = slab.from;
            const slabTo = slab.to == null ? Infinity : slab.to;
            // overlap between [max(slabFrom, minKm+1) ... ] hmm
            // We treat the minimum km as covered by base fare, so chargeable range is (minKm, distanceKm].
            // Slab definitions in the seed are absolute (e.g., 4-10 km). We need to figure out
            // which part of the journey falls in each slab.
            // Chargeable journey range: from minKm to distanceKm.
            const journeyStart = minKm;
            const journeyEnd = distanceKm;
            const overlapStart = Math.max(slabFrom, journeyStart);
            const overlapEnd = Math.min(slabTo, journeyEnd);
            if (overlapEnd >= overlapStart && overlapEnd > journeyStart) {
                const km = overlapEnd - overlapStart;
                if (km > 0) {
                    total += km * slab.rate;
                }
            }
        }
        notes.push(`Distance charge: ${chargeableKm.toFixed(1)} km beyond ${minKm} km minimum, using ${slabs.length} slabs`);
        return {
            charge: Math.round(total),
            notes
        };
    }
    // Flat per-km fallback
    if (price.perKmRate > 0) {
        const charge = chargeableKm * price.perKmRate;
        notes.push(`Distance charge: ${chargeableKm.toFixed(1)} km × ₹${price.perKmRate}/km`);
        return {
            charge: Math.round(charge),
            notes
        };
    }
    return {
        charge: 0,
        notes: [
            "No distance rate configured"
        ]
    };
}
function calculateFare(price, input) {
    const notes = [];
    const isManual = price.itemType === "Emergency Service" || price.minimumFare === 0 && price.perKmRate === 0 && parseSlabs(price.slabJson).length === 0 && price.minimumBooking === 0;
    // Manual quote only (e.g., Emergency, or admin-marked manual quote)
    if (isManual) {
        return {
            baseFare: 0,
            distanceCharge: 0,
            loadingCharge: 0,
            waitingCharge: 0,
            helperCharge: 0,
            nightCharge: 0,
            expressCharge: 0,
            extraCharge: 0,
            tollParking: 0,
            gst: 0,
            subtotal: 0,
            discountPercent: 0,
            discountAmount: 0,
            finalEstimate: 0,
            advanceAmount: 0,
            commissionPercent: price.commissionPercent || 0,
            commissionAmount: 0,
            manualQuote: true,
            calculationNotes: [
                "Manual quote only — admin will confirm price"
            ]
        };
    }
    const baseFare = price.minimumFare;
    notes.push(`Base fare (minimum ₹${baseFare} for ${price.minimumKm} km)`);
    const { charge: distanceCharge, notes: distNotes } = calculateDistanceCharge(price, input.distanceKm);
    notes.push(...distNotes);
    const loadingCharge = input.loadingChargeOverride != null ? input.loadingChargeOverride : price.loadingCharge;
    if (loadingCharge > 0) notes.push(`Loading charge: ₹${loadingCharge}`);
    const waitingCharge = price.waitingCharge > 0 && input.waitingMinutes && input.waitingMinutes > 0 ? Math.round(price.waitingCharge * input.waitingMinutes) : 0;
    if (waitingCharge > 0) notes.push(`Waiting charge: ${input.waitingMinutes} min × ₹${price.waitingCharge}`);
    const helperCharge = input.needsHelper ? price.helperCharge : 0;
    if (helperCharge > 0) notes.push(`Helper charge: ₹${helperCharge}`);
    const extraCharge = input.extraChargeOverride != null ? input.extraChargeOverride : price.extraCharge || 0;
    if (extraCharge > 0) notes.push(`Extra charge: ₹${extraCharge}`);
    const subtotalBeforeGst = baseFare + distanceCharge + loadingCharge + waitingCharge + helperCharge + extraCharge;
    const nightCharge = price.nightChargePercent > 0 && input.isNight ? Math.round(subtotalBeforeGst * price.nightChargePercent / 100) : 0;
    if (nightCharge > 0) notes.push(`Night charge: ${price.nightChargePercent}%`);
    const expressCharge = price.expressChargePercent > 0 && input.isExpress ? Math.round(subtotalBeforeGst * price.expressChargePercent / 100) : 0;
    if (expressCharge > 0) notes.push(`Express charge: ${price.expressChargePercent}%`);
    const tollParking = input.tollParking || 0;
    if (tollParking > 0) notes.push(`Toll & parking: ₹${tollParking}`);
    const gst = price.gstPercent > 0 ? Math.round(subtotalBeforeGst * price.gstPercent / 100) : 0;
    if (gst > 0) notes.push(`GST: ${price.gstPercent}%`);
    const subtotal = subtotalBeforeGst + nightCharge + expressCharge + tollParking;
    let finalEstimate = subtotal + gst;
    // Apply Porter-match auto-discount (after GST, before rounding & minimum-booking floor)
    let discountPercent = 0;
    let discountAmount = 0;
    const porter = input.porterMatch;
    if (porter && porter.enabled && porter.bands.length > 0) {
        const bandPct = pickPorterDiscount(finalEstimate, porter.bands);
        if (bandPct > 0) {
            const candidateDiscount = Math.round(finalEstimate * bandPct / 100);
            const commissionPct = porter.commissionPercent || price.commissionPercent || 0;
            // Floor protection: skip discount if it would drop commission below floor
            if (commissionPct > 0) {
                const commissionAfterDiscount = Math.round((finalEstimate - candidateDiscount) * commissionPct / 100);
                if (commissionAfterDiscount < porter.minCommissionFloor) {
                    notes.push(`Porter-match discount skipped: would drop commission below ₹${porter.minCommissionFloor} floor`);
                } else {
                    discountPercent = bandPct;
                    discountAmount = candidateDiscount;
                    finalEstimate -= discountAmount;
                    notes.push(`Porter-match discount: ${discountPercent}% (−₹${discountAmount})`);
                }
            } else {
                discountPercent = bandPct;
                discountAmount = candidateDiscount;
                finalEstimate -= discountAmount;
                notes.push(`Porter-match discount: ${discountPercent}% (−₹${discountAmount})`);
            }
        }
    }
    // Per-vehicle static discount (from price master) — only if no porter discount applied
    if (discountAmount === 0 && (price.discountPercent || 0) > 0) {
        discountPercent = price.discountPercent || 0;
        discountAmount = Math.round(finalEstimate * discountPercent / 100);
        finalEstimate -= discountAmount;
        notes.push(`Discount: ${discountPercent}% (−₹${discountAmount})`);
    }
    // Round to nearest ₹5
    const rounded = Math.round(finalEstimate / 5) * 5;
    if (rounded !== finalEstimate) {
        notes.push(`Rounded to nearest ₹5 (₹${rounded})`);
        finalEstimate = rounded;
    }
    const advanceAmount = price.advancePercent > 0 ? Math.round(finalEstimate * price.advancePercent / 100) : 0;
    if (advanceAmount > 0) notes.push(`Advance (${price.advancePercent}%): ₹${advanceAmount}`);
    const commissionPercent = price.commissionPercent || 0;
    const commissionAmount = Math.round(finalEstimate * commissionPercent / 100);
    if (price.minimumBooking > 0 && finalEstimate < price.minimumBooking) {
        notes.push(`Adjusted to minimum booking ₹${price.minimumBooking}`);
        return {
            baseFare,
            distanceCharge,
            loadingCharge,
            waitingCharge,
            helperCharge,
            nightCharge,
            expressCharge,
            extraCharge,
            tollParking,
            gst,
            subtotal,
            discountPercent,
            discountAmount,
            finalEstimate: price.minimumBooking,
            advanceAmount,
            commissionPercent,
            commissionAmount: Math.round(price.minimumBooking * commissionPercent / 100),
            manualQuote: false,
            calculationNotes: notes
        };
    }
    return {
        baseFare,
        distanceCharge,
        loadingCharge,
        waitingCharge,
        helperCharge,
        nightCharge,
        expressCharge,
        extraCharge,
        tollParking,
        gst,
        subtotal,
        discountPercent,
        discountAmount,
        finalEstimate,
        advanceAmount,
        commissionPercent,
        commissionAmount,
        manualQuote: false,
        calculationNotes: notes
    };
}
}),
"[project]/src/lib/config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALLOWED_UPLOAD_EXTS",
    ()=>ALLOWED_UPLOAD_EXTS,
    "ALLOWED_UPLOAD_TYPES",
    ()=>ALLOWED_UPLOAD_TYPES,
    "extractPincode",
    ()=>extractPincode,
    "formatIST",
    ()=>formatIST,
    "getISTParts",
    ()=>getISTParts,
    "getPorterMatchConfig",
    ()=>getPorterMatchConfig,
    "getSettingsMap",
    ()=>getSettingsMap,
    "isNightChargeActive",
    ()=>isNightChargeActive,
    "isServiceable",
    ()=>isServiceable,
    "isValidIndianMobile",
    ()=>isValidIndianMobile,
    "validateUpload",
    ()=>validateUpload
]);
// Shared helpers to read admin settings + porter-match config + serviceable-area check
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$fare$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/fare.ts [app-route] (ecmascript)");
;
;
async function getSettingsMap() {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].settings.findMany();
    const m = {};
    for (const r of rows)if (r.value != null) m[r.key] = r.value;
    return m;
}
async function getPorterMatchConfig(commissionPercent) {
    const s = await getSettingsMap();
    const enabled = s.porter_match_enabled !== "false";
    const bands = s.porter_match_bands ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$fare$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parsePorterBands"])(s.porter_match_bands) : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$fare$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_PORTER_BANDS"];
    const floor = Number(s.porter_min_commission_floor || 20);
    return {
        enabled,
        bands,
        minCommissionFloor: Number.isFinite(floor) ? floor : 20,
        commissionPercent: commissionPercent || 0
    };
}
async function isServiceable(address, pincode) {
    const s = await getSettingsMap();
    if (!s.serviceable_areas) return {
        ok: true
    }; // no restriction configured
    let areas = [];
    try {
        areas = JSON.parse(s.serviceable_areas);
    } catch  {
        return {
            ok: true
        };
    }
    if (!Array.isArray(areas) || areas.length === 0) return {
        ok: true
    };
    const haystack = `${address || ""} ${pincode || ""}`.toLowerCase();
    for (const a of areas){
        const token = String(a).toLowerCase().trim();
        if (!token) continue;
        if (haystack.includes(token)) return {
            ok: true
        };
    }
    return {
        ok: false,
        reason: "Sorry, we don't serve this area yet. Currently servicing Karnataka."
    };
}
function extractPincode(text) {
    if (!text) return null;
    const m = text.match(/\b(\d{6})\b/);
    return m ? m[1] : null;
}
function isValidIndianMobile(mobile) {
    const clean = String(mobile || "").replace(/\D/g, "");
    return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
}
const ALLOWED_UPLOAD_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
];
const ALLOWED_UPLOAD_EXTS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf"
];
function validateUpload(file, maxMb = 5) {
    const typeOk = ALLOWED_UPLOAD_TYPES.includes(file.type) || ALLOWED_UPLOAD_EXTS.some((e)=>file.name.toLowerCase().endsWith(e));
    if (!typeOk) return {
        ok: false,
        error: "Only JPG, PNG, WEBP, PDF files allowed"
    };
    if (file.size > maxMb * 1024 * 1024) return {
        ok: false,
        error: `File too large. Max ${maxMb}MB`
    };
    return {
        ok: true
    };
}
// ---- IST helpers ----
// India is UTC+5:30 with no DST. We compute IST directly from the UTC ms epoch.
const IST_OFFSET_MIN = 330; // 5h 30m
function getISTParts(d = new Date()) {
    const istMs = d.getTime() + IST_OFFSET_MIN * 60 * 1000;
    const ist = new Date(istMs);
    return {
        year: ist.getUTCFullYear(),
        month: ist.getUTCMonth() + 1,
        day: ist.getUTCDate(),
        hour: ist.getUTCHours(),
        minute: ist.getUTCMinutes()
    };
}
function formatIST(d = new Date()) {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}
async function isNightChargeActive(bookingDate = new Date()) {
    const s = await getSettingsMap();
    if (s.night_charge_auto_apply === "false") return false;
    const startH = Number(s.night_charge_start_hour);
    const endH = Number(s.night_charge_end_hour);
    if (!Number.isFinite(startH) || !Number.isFinite(endH)) return false;
    const hour = getISTParts(bookingDate).hour;
    // Window can wrap midnight, e.g. start=22, end=5 → active if hour>=22 OR hour<5
    if (startH === endH) return false;
    if (startH < endH) return hour >= startH && hour < endH;
    return hour >= startH || hour < endH;
}
}),
"[project]/src/lib/rate-limit.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// In-memory rate limiter (per-IP / per-key). Resets every minute window.
//
// IMPORTANT LIMITATION: This in-memory limiter does NOT reliably persist across
// Vercel serverless invocations. Each cold-start or warm instance may have its
// own independent bucket. It still helps as a best-effort layer on warm instances
// (which handle most traffic), but determined attackers could bypass it by
// triggering cold starts.
//
// For true distributed rate limiting on Vercel, use Upstash Redis or Vercel KV.
// The current implementation is intentionally kept simple and does NOT claim to
// be "safe for serverless" — it is a best-effort layer only.
__turbopack_context__.s([
    "getClientIp",
    ()=>getClientIp,
    "rateLimit",
    ()=>rateLimit
]);
const buckets = new Map();
// periodic cleanup
if (typeof setInterval !== "undefined") {
    setInterval(()=>{
        const now = Date.now();
        for (const [k, v] of buckets){
            if (v.resetAt < now) buckets.delete(k);
        }
    }, 60_000).unref?.();
}
function rateLimit(key, maxPerMinute) {
    const now = Date.now();
    const existing = buckets.get(key);
    if (!existing || existing.resetAt < now) {
        buckets.set(key, {
            count: 1,
            resetAt: now + 60_000
        });
        return {
            ok: true,
            remaining: maxPerMinute - 1,
            retryAfterSec: 60
        };
    }
    if (existing.count >= maxPerMinute) {
        return {
            ok: false,
            remaining: 0,
            retryAfterSec: Math.ceil((existing.resetAt - now) / 1000)
        };
    }
    existing.count += 1;
    return {
        ok: true,
        remaining: maxPerMinute - existing.count,
        retryAfterSec: Math.ceil((existing.resetAt - now) / 1000)
    };
}
function getClientIp(req) {
    const headers = req.headers;
    return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "unknown";
}
}),
"[project]/src/app/api/admin/login/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$password$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/password.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/rate-limit.ts [app-route] (ecmascript)");
;
;
;
;
;
async function POST(req) {
    try {
        const ip = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getClientIp"])(req);
        const settings = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSettingsMap"])();
        const limit = Number(settings.rate_limit_login_per_minute || 5);
        const rl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rateLimit"])(`login:${ip}`, Number.isFinite(limit) ? limit : 5);
        if (!rl.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Too many login attempts. Retry in ${rl.retryAfterSec}s.`
            }, {
                status: 429
            });
        }
        const { email, password } = await req.json();
        if (!email || !password) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Email and password required"
        }, {
            status: 400
        });
        const admin = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].adminUser.findUnique({
            where: {
                email: String(email).toLowerCase().trim()
            }
        });
        if (!admin || admin.status !== "Active") {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].adminActivity.create({
                data: {
                    adminId: admin?.id || null,
                    action: "login_failed",
                    detail: `Email: ${email}`,
                    ip
                }
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Invalid credentials"
            }, {
                status: 401
            });
        }
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$password$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyPassword"])(password, admin.passwordHash)) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].adminActivity.create({
                data: {
                    adminId: admin.id,
                    action: "login_failed",
                    detail: "Wrong password",
                    ip
                }
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Invalid credentials"
            }, {
                status: 401
            });
        }
        const timeoutMin = Number(settings.session_timeout_minutes || 60);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSession"])(admin.id, Number.isFinite(timeoutMin) ? timeoutMin : 60);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].adminActivity.create({
            data: {
                adminId: admin.id,
                action: "login_success",
                detail: `Role: ${admin.role}`,
                ip
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                forcePasswordChange: admin.forcePasswordChange
            }
        });
    } catch (e) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: e?.message || "Login failed"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0m9zafk._.js.map