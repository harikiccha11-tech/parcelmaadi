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
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

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
"[project]/src/app/api/admin/me/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript) <locals>");
;
;
async function GET() {
    const auth = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["requireAdmin"])();
    if (!auth.ok) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: auth.error
    }, {
        status: auth.status
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        admin: {
            id: auth.admin.id,
            name: auth.admin.name,
            email: auth.admin.email,
            role: auth.admin.role
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0o9g-bm._.js.map