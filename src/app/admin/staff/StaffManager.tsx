"use client";

// Staff & custom-role management (SUPER_ADMIN). Create admins, assign custom
// roles, toggle active state; build permission matrices per role.

import { useCallback, useEffect, useState } from "react";

type Staff = {
  id: string; name: string; email: string; phone: string; role: string;
  isActive: boolean; customRole: { id: string; name: string } | null;
};
type Role = { id: string; name: string; description: string | null; permissions: string; isActive: boolean; _count: { users: number } };

const inputCls = "mt-1 w-full rounded-lg border border-pm-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-pm-red";

export default function StaffManager() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<"staff" | "roles">("staff");

  const load = useCallback(async () => {
    const [s, r] = await Promise.all([
      fetch("/api/admin/staff").then((x) => x.json()),
      fetch("/api/admin/custom-roles").then((x) => x.json()),
    ]);
    if (s.ok) setStaff(s.staff);
    if (r.ok) {
      setRoles(r.roles);
      setModules(r.modules);
    }
    if (!s.ok) setMsg(s.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- new staff form ----
  const [nf, setNf] = useState({ name: "", email: "", phone: "", password: "", role: "ADMIN", customRoleId: "" });
  async function createStaff() {
    setMsg(null);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nf, customRoleId: nf.customRoleId || undefined }),
    });
    const d = await res.json();
    setMsg(d.ok ? "Staff member created" : d.error);
    if (d.ok) {
      setNf({ name: "", email: "", phone: "", password: "", role: "ADMIN", customRoleId: "" });
      await load();
    }
  }

  async function toggleStaff(id: string, isActive: boolean) {
    await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await load();
  }

  async function assignRole(id: string, customRoleId: string) {
    await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customRoleId: customRoleId || null }),
    });
    await load();
  }

  return (
    <div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setTab("staff")} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === "staff" ? "bg-pm-red text-white" : "bg-white shadow"}`}>
          Staff
        </button>
        <button type="button" onClick={() => setTab("roles")} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === "roles" ? "bg-pm-red text-white" : "bg-white shadow"}`}>
          Custom roles
        </button>
      </div>

      {msg && <p className="mt-3 rounded-lg bg-pm-yellow/50 px-3 py-2 text-sm font-medium">{msg}</p>}

      {tab === "staff" ? (
        <>
          <div className="mt-4 space-y-2">
            {staff.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow">
                <div>
                  <p className="text-sm font-bold">
                    {s.name}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.role === "SUPER_ADMIN" ? "bg-pm-ink text-pm-yellow" : "bg-blue-100 text-blue-800"}`}>{s.role}</span>
                    {!s.isActive && <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">SUSPENDED</span>}
                  </p>
                  <p className="text-xs text-pm-ink/50">{s.email} · {s.phone}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {s.role === "ADMIN" && (
                    <select
                      value={s.customRole?.id ?? ""}
                      onChange={(e) => assignRole(s.id, e.target.value)}
                      className="rounded-lg border border-pm-ink/20 px-2 py-1.5 text-xs outline-none focus:border-pm-red"
                    >
                      <option value="">Full admin (no restriction)</option>
                      {roles.filter((r) => r.isActive).map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleStaff(s.id, s.isActive)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${s.isActive ? "border border-pm-red/40 text-pm-red hover:bg-pm-red/10" : "bg-green-600 text-white hover:bg-green-700"}`}
                  >
                    {s.isActive ? "Suspend" : "Reactivate"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow">
            <p className="text-sm font-bold">Add staff member</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="Full name" className={inputCls} />
              <input value={nf.email} onChange={(e) => setNf({ ...nf, email: e.target.value })} placeholder="Email" className={inputCls} />
              <input value={nf.phone} onChange={(e) => setNf({ ...nf, phone: e.target.value.replace(/\D/g, "") })} maxLength={10} placeholder="Mobile" className={inputCls} />
              <input type="password" value={nf.password} onChange={(e) => setNf({ ...nf, password: e.target.value })} placeholder="Password (min 8)" className={inputCls} />
              <select value={nf.role} onChange={(e) => setNf({ ...nf, role: e.target.value })} className={inputCls}>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super admin</option>
              </select>
              {nf.role === "ADMIN" && (
                <select value={nf.customRoleId} onChange={(e) => setNf({ ...nf, customRoleId: e.target.value })} className={inputCls}>
                  <option value="">Full admin (no restriction)</option>
                  {roles.filter((r) => r.isActive).map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
            </div>
            <button
              type="button"
              onClick={createStaff}
              disabled={!nf.name || !nf.email || nf.phone.length !== 10 || nf.password.length < 8}
              className="mt-3 rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50"
            >
              + Add staff
            </button>
          </div>
        </>
      ) : (
        <RolesEditor roles={roles} modules={modules} onChange={load} setMsg={setMsg} />
      )}
    </div>
  );
}

function RolesEditor({ roles, modules, onChange, setMsg }: { roles: Role[]; modules: string[]; onChange: () => void; setMsg: (m: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [matrix, setMatrix] = useState<Record<string, { view: boolean; edit: boolean }>>({});

  function toggle(mod: string, key: "view" | "edit") {
    setMatrix((m) => {
      const cur = m[mod] ?? { view: false, edit: false };
      const next = { ...cur, [key]: !cur[key] };
      if (key === "edit" && next.edit) next.view = true; // edit implies view
      if (key === "view" && !next.view) next.edit = false;
      return { ...m, [mod]: next };
    });
  }

  async function createRole() {
    const permissions: Record<string, { view: boolean; edit: boolean }> = {};
    for (const mod of modules) permissions[mod] = matrix[mod] ?? { view: false, edit: false };
    const res = await fetch("/api/admin/custom-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined, permissions }),
    });
    const d = await res.json();
    setMsg(d.ok ? "Role created" : d.error);
    if (d.ok) {
      setName("");
      setDescription("");
      setMatrix({});
      onChange();
    }
  }

  async function deleteRole(id: string) {
    if (!confirm("Delete this role?")) return;
    const res = await fetch(`/api/admin/custom-roles/${id}`, { method: "DELETE" });
    const d = await res.json();
    setMsg(d.ok ? "Role deleted" : d.error);
    onChange();
  }

  async function toggleActive(r: Role) {
    await fetch(`/api/admin/custom-roles/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
    onChange();
  }

  return (
    <div>
      <div className="mt-4 space-y-2">
        {roles.map((r) => {
          let perms: Record<string, { view: boolean; edit: boolean }> = {};
          try {
            perms = JSON.parse(r.permissions);
          } catch {
            /* ignore */
          }
          const allowed = Object.entries(perms).filter(([, p]) => p.view).map(([m]) => m);
          return (
            <div key={r.id} className="rounded-2xl bg-white p-4 shadow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold">
                  {r.name}
                  {!r.isActive && <span className="ml-2 rounded-full bg-pm-cream px-2 py-0.5 text-[10px] font-bold text-pm-ink/50">DISABLED</span>}
                  <span className="ml-2 text-xs font-normal text-pm-ink/50">{r._count.users} user(s)</span>
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => toggleActive(r)} className="rounded-full border border-pm-ink/20 px-3 py-1 text-xs font-semibold hover:bg-pm-yellow/40">
                    {r.isActive ? "Disable" : "Enable"}
                  </button>
                  <button type="button" onClick={() => deleteRole(r.id)} className="rounded-full border border-pm-red/40 px-3 py-1 text-xs font-semibold text-pm-red hover:bg-pm-red/10">
                    Delete
                  </button>
                </div>
              </div>
              {r.description && <p className="text-xs text-pm-ink/60">{r.description}</p>}
              <p className="mt-1 text-xs text-pm-ink/50">Access: {allowed.join(", ") || "none"}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow">
        <p className="text-sm font-bold">Create custom role</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name (e.g. Support Agent)" className={inputCls} />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className={inputCls} />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-pm-ink/50">Permission matrix</p>
        <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {modules.map((mod) => {
            const cur = matrix[mod] ?? { view: false, edit: false };
            return (
              <div key={mod} className="flex items-center justify-between rounded-lg bg-pm-cream/60 px-3 py-1.5">
                <span className="text-sm font-medium capitalize">{mod}</span>
                <div className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={cur.view} onChange={() => toggle(mod, "view")} className="h-3.5 w-3.5 accent-pm-red" /> View
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={cur.edit} onChange={() => toggle(mod, "edit")} className="h-3.5 w-3.5 accent-pm-red" /> Edit
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={createRole}
          disabled={!name}
          className="mt-3 rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50"
        >
          + Create role
        </button>
      </div>
    </div>
  );
}
