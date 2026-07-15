"use client";

// CMS manager: pages, blog/news, and blocks (banners/sliders/popups/menu/
// footer/header links). Full lifecycle: draft/publish, hide/show, archive/
// restore, coming-soon, delete, and up/down ordering.

import { useCallback, useEffect, useState } from "react";

type Page = {
  id: string; slug: string; kind: string; title: string; content: string; status: string;
  showInFooter: boolean; showInMenu: boolean; showInHeader: boolean; isArchived: boolean;
  comingSoon: boolean; sortOrder: number; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null;
};
type Block = {
  id: string; kind: string; title: string; content: string | null; imageUrl: string | null;
  linkUrl: string | null; sortOrder: number; isActive: boolean; isArchived: boolean; comingSoon: boolean;
};

const inputCls = "mt-1 w-full rounded-lg border border-pm-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-pm-red";
const blockKinds = ["BANNER", "SLIDER", "POPUP", "HEADER_LINK", "MENU_LINK", "FOOTER_LINK"];

export default function CmsManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blog, setBlog] = useState<Page[]>([]);
  const [tab, setTab] = useState<"pages" | "blocks" | "blog">("pages");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [cms, b] = await Promise.all([
      fetch("/api/admin/cms").then((r) => r.json()),
      fetch("/api/admin/blog").then((r) => r.json()),
    ]);
    if (cms.ok) {
      setPages(cms.pages.filter((p: Page) => p.kind !== "BLOG"));
      setBlocks(cms.blocks);
    }
    if (b.ok) setBlog(b.posts);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patchPage(id: string, body: Record<string, unknown>, kind: "page" | "blog" = "page") {
    const url = kind === "blog" ? `/api/admin/blog/${id}` : `/api/admin/cms/${id}?kind=page`;
    await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load();
  }
  async function deletePage(id: string, kind: "page" | "blog" = "page") {
    if (!confirm("Delete this item?")) return;
    const url = kind === "blog" ? `/api/admin/blog/${id}` : `/api/admin/cms/${id}?kind=page`;
    await fetch(url, { method: "DELETE" });
    await load();
  }
  async function patchBlock(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/cms/${id}?kind=block`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load();
  }
  async function deleteBlock(id: string) {
    if (!confirm("Delete this block?")) return;
    await fetch(`/api/admin/cms/${id}?kind=block`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="flex gap-2">
        {(["pages", "blog", "blocks"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${tab === t ? "bg-pm-red text-white" : "bg-white shadow"}`}>
            {t === "blocks" ? "Banners & menus" : t}
          </button>
        ))}
      </div>
      {msg && <p className="mt-3 rounded-lg bg-pm-yellow/50 px-3 py-2 text-sm font-medium">{msg}</p>}

      {tab === "pages" && <PagesTab pages={pages} onPatch={(id, b) => patchPage(id, b)} onDelete={(id) => deletePage(id)} onReload={load} setMsg={setMsg} />}
      {tab === "blog" && <BlogTab posts={blog} onPatch={(id, b) => patchPage(id, b, "blog")} onDelete={(id) => deletePage(id, "blog")} onReload={load} setMsg={setMsg} />}
      {tab === "blocks" && <BlocksTab blocks={blocks} onPatch={patchBlock} onDelete={deleteBlock} onReload={load} setMsg={setMsg} />}
    </div>
  );
}

function LifecycleRow({ children, onMoveUp, onMoveDown }: { children: React.ReactNode; onMoveUp: () => void; onMoveDown: () => void }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5">
          <button type="button" onClick={onMoveUp} className="rounded bg-pm-cream px-1.5 text-xs hover:bg-pm-yellow/50" aria-label="Move up">▲</button>
          <button type="button" onClick={onMoveDown} className="rounded bg-pm-cream px-1.5 text-xs hover:bg-pm-yellow/50" aria-label="Move down">▼</button>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function PagesTab({ pages, onPatch, onDelete, onReload, setMsg }: { pages: Page[]; onPatch: (id: string, b: Record<string, unknown>) => void; onDelete: (id: string) => void; onReload: () => void; setMsg: (m: string) => void }) {
  const [form, setForm] = useState({ slug: "", title: "", content: "", status: "PUBLISHED", metaTitle: "", metaDescription: "" });
  async function create() {
    const res = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "page", ...form, metaTitle: form.metaTitle || undefined, metaDescription: form.metaDescription || undefined }),
    });
    const d = await res.json();
    setMsg(d.ok ? "Page created" : d.error);
    if (d.ok) {
      setForm({ slug: "", title: "", content: "", status: "PUBLISHED", metaTitle: "", metaDescription: "" });
      onReload();
    }
  }
  return (
    <div className="mt-4 space-y-2">
      {pages.map((p) => (
        <LifecycleRow key={p.id} onMoveUp={() => onPatch(p.id, { move: "up" })} onMoveDown={() => onPatch(p.id, { move: "down" })}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold">
                {p.title} <span className="font-mono text-xs font-normal text-pm-ink/40">/{p.slug}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === "PUBLISHED" ? "bg-green-100 text-green-800" : p.status === "DRAFT" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}`}>{p.status}</span>
                {p.isArchived && <span className="ml-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold">ARCHIVED</span>}
                {p.comingSoon && <span className="ml-1 rounded-full bg-pm-yellow px-2 py-0.5 text-[10px] font-bold">SOON</span>}
              </p>
              <p className="text-xs text-pm-ink/50">Footer: {p.showInFooter ? "✓" : "—"} · Menu: {p.showInMenu ? "✓" : "—"} · Header: {p.showInHeader ? "✓" : "—"}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => onPatch(p.id, { status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })} className="rounded-full bg-pm-yellow px-3 py-1 text-xs font-bold hover:bg-pm-yellow-deep">
                {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              </button>
              <button type="button" onClick={() => onPatch(p.id, { showInFooter: !p.showInFooter })} className="rounded-full border border-pm-ink/20 px-3 py-1 text-xs font-semibold hover:bg-pm-cream">
                {p.showInFooter ? "Hide footer" : "Show footer"}
              </button>
              <button type="button" onClick={() => onPatch(p.id, { showInHeader: !p.showInHeader })} className="rounded-full border border-pm-ink/20 px-3 py-1 text-xs font-semibold hover:bg-pm-cream">
                {p.showInHeader ? "Hide header" : "Show header"}
              </button>
              <button type="button" onClick={() => onPatch(p.id, { isArchived: !p.isArchived })} className="rounded-full border border-pm-ink/20 px-3 py-1 text-xs font-semibold hover:bg-pm-cream">
                {p.isArchived ? "Restore" : "Archive"}
              </button>
              <button type="button" onClick={() => onPatch(p.id, { comingSoon: !p.comingSoon })} className="rounded-full border border-pm-ink/20 px-3 py-1 text-xs font-semibold hover:bg-pm-cream">
                {p.comingSoon ? "Live" : "Coming soon"}
              </button>
              <button type="button" onClick={() => onDelete(p.id)} className="rounded-full border border-pm-red/40 px-3 py-1 text-xs font-semibold text-pm-red hover:bg-pm-red/10">Delete</button>
            </div>
          </div>
          <EditableContent page={p} onPatch={onPatch} />
        </LifecycleRow>
      ))}

      <div className="mt-4 rounded-2xl bg-white p-5 shadow">
        <p className="text-sm font-bold">New page</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="slug (about-us)" className={inputCls} />
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className={inputCls} />
          <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} placeholder="SEO title (optional)" className={inputCls} />
          <input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} placeholder="SEO description (optional)" className={inputCls} />
        </div>
        <textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Page content" className={inputCls} />
        <button type="button" onClick={create} disabled={!form.slug || !form.title || !form.content} className="mt-3 rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">
          + Create page
        </button>
      </div>
    </div>
  );
}

function EditableContent({ page, onPatch }: { page: Page; onPatch: (id: string, b: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(page.content);
  const [title, setTitle] = useState(page.title);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs font-bold text-pm-red hover:underline">
        Edit content →
      </button>
    );
  }
  return (
    <div className="mt-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} className={inputCls} />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => { onPatch(page.id, { title, content }); setOpen(false); }} className="rounded-full bg-pm-red px-4 py-1.5 text-xs font-bold text-white hover:bg-pm-red-deep">Save</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-pm-ink/20 px-4 py-1.5 text-xs font-semibold">Cancel</button>
      </div>
    </div>
  );
}

function BlogTab({ posts, onPatch, onDelete, onReload, setMsg }: { posts: Page[]; onPatch: (id: string, b: Record<string, unknown>) => void; onDelete: (id: string) => void; onReload: () => void; setMsg: (m: string) => void }) {
  const [form, setForm] = useState({ slug: "", title: "", content: "", status: "DRAFT" });
  async function create() {
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setMsg(d.ok ? "Post created" : d.error);
    if (d.ok) {
      setForm({ slug: "", title: "", content: "", status: "DRAFT" });
      onReload();
    }
  }
  return (
    <div className="mt-4 space-y-2">
      {posts.map((p) => (
        <LifecycleRow key={p.id} onMoveUp={() => onPatch(p.id, { move: "up" })} onMoveDown={() => onPatch(p.id, { move: "down" })}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold">
                {p.title} <span className="font-mono text-xs font-normal text-pm-ink/40">/{p.slug}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{p.status}</span>
                {p.comingSoon && <span className="ml-1 rounded-full bg-pm-yellow px-2 py-0.5 text-[10px] font-bold">SOON</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => onPatch(p.id, { status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })} className="rounded-full bg-pm-yellow px-3 py-1 text-xs font-bold hover:bg-pm-yellow-deep">
                {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              </button>
              <button type="button" onClick={() => onPatch(p.id, { isArchived: !p.isArchived })} className="rounded-full border border-pm-ink/20 px-3 py-1 text-xs font-semibold hover:bg-pm-cream">
                {p.isArchived ? "Restore" : "Archive"}
              </button>
              <button type="button" onClick={() => onDelete(p.id)} className="rounded-full border border-pm-red/40 px-3 py-1 text-xs font-semibold text-pm-red hover:bg-pm-red/10">Delete</button>
            </div>
          </div>
          <EditableContent page={p} onPatch={onPatch} />
        </LifecycleRow>
      ))}

      <div className="mt-4 rounded-2xl bg-white p-5 shadow">
        <p className="text-sm font-bold">New blog / news post</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="slug" className={inputCls} />
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className={inputCls} />
        </div>
        <textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Post body" className={inputCls} />
        <button type="button" onClick={create} disabled={!form.slug || !form.title || !form.content} className="mt-3 rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">
          + Create post
        </button>
      </div>
    </div>
  );
}

function BlocksTab({ blocks, onPatch, onDelete, onReload, setMsg }: { blocks: Block[]; onPatch: (id: string, b: Record<string, unknown>) => void; onDelete: (id: string) => void; onReload: () => void; setMsg: (m: string) => void }) {
  const [form, setForm] = useState({ blockKind: "BANNER", title: "", content: "", linkUrl: "", imageUrl: "" });
  async function create() {
    const res = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "block",
        blockKind: form.blockKind,
        title: form.title,
        content: form.content || undefined,
        linkUrl: form.linkUrl || undefined,
        imageUrl: form.imageUrl || undefined,
      }),
    });
    const d = await res.json();
    setMsg(d.ok ? "Block created" : d.error);
    if (d.ok) {
      setForm({ blockKind: "BANNER", title: "", content: "", linkUrl: "", imageUrl: "" });
      onReload();
    }
  }
  return (
    <div className="mt-4">
      {blockKinds.map((k) => {
        const items = blocks.filter((b) => b.kind === k);
        if (items.length === 0) return null;
        return (
          <div key={k} className="mt-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-pm-ink/50">{k.replace("_", " ")}</h2>
            <div className="mt-2 space-y-2">
              {items.map((b) => (
                <LifecycleRow key={b.id} onMoveUp={() => onPatch(b.id, { move: "up" })} onMoveDown={() => onPatch(b.id, { move: "down" })}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">
                        {b.title}
                        {!b.isActive && <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold">HIDDEN</span>}
                        {b.isArchived && <span className="ml-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold">ARCHIVED</span>}
                        {b.comingSoon && <span className="ml-1 rounded-full bg-pm-yellow px-2 py-0.5 text-[10px] font-bold">SOON</span>}
                      </p>
                      {b.linkUrl && <p className="font-mono text-xs text-pm-ink/40">{b.linkUrl}</p>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => onPatch(b.id, { isActive: !b.isActive })} className="rounded-full bg-pm-yellow px-3 py-1 text-xs font-bold hover:bg-pm-yellow-deep">
                        {b.isActive ? "Hide" : "Show"}
                      </button>
                      <button type="button" onClick={() => onPatch(b.id, { isArchived: !b.isArchived })} className="rounded-full border border-pm-ink/20 px-3 py-1 text-xs font-semibold hover:bg-pm-cream">
                        {b.isArchived ? "Restore" : "Archive"}
                      </button>
                      <button type="button" onClick={() => onPatch(b.id, { comingSoon: !b.comingSoon })} className="rounded-full border border-pm-ink/20 px-3 py-1 text-xs font-semibold hover:bg-pm-cream">
                        {b.comingSoon ? "Live" : "Coming soon"}
                      </button>
                      <button type="button" onClick={() => onDelete(b.id)} className="rounded-full border border-pm-red/40 px-3 py-1 text-xs font-semibold text-pm-red hover:bg-pm-red/10">Delete</button>
                    </div>
                  </div>
                </LifecycleRow>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-6 rounded-2xl bg-white p-5 shadow">
        <p className="text-sm font-bold">New block</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select value={form.blockKind} onChange={(e) => setForm({ ...form, blockKind: e.target.value })} className={inputCls}>
            {blockKinds.map((k) => (
              <option key={k} value={k}>{k.replace("_", " ")}</option>
            ))}
          </select>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title / text" className={inputCls} />
          <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="Link URL (optional)" className={inputCls} />
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Image URL (optional)" className={inputCls} />
        </div>
        <button type="button" onClick={create} disabled={!form.title} className="mt-3 rounded-full bg-pm-red px-5 py-2 text-sm font-bold text-white hover:bg-pm-red-deep disabled:opacity-50">
          + Create block
        </button>
      </div>
    </div>
  );
}
