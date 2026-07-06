"use client";
import { useEffect, useRef } from "react";

// Animated motion background — canvas-based floating parcel/vehicle icons + moving gradient.
// Premium feel, lightweight (CSS + canvas), no external video file needed.
export function MotionBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    let raf = 0;

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);

    // floating icons — parcels, trucks, bikes as simple emoji/text shapes
    const icons = ["📦", "🚚", "🛵", "🚐", "🏗️", "💧", "🛻", "📋"];
    const particles: { x: number; y: number; vx: number; vy: number; size: number; rot: number; vr: number; icon: string; alpha: number }[] = [];
    const count = Math.min(14, Math.floor(w / 80));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.4,
        size: 18 + Math.random() * 24,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.01,
        icon: icons[Math.floor(Math.random() * icons.length)],
        alpha: 0.08 + Math.random() * 0.12,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < -40) { p.y = h + 40; p.x = Math.random() * w; }
        if (p.x < -40) p.x = w + 40;
        if (p.x > w + 40) p.x = -40;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.icon, 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Animated gradient layers */}
      <div className="absolute inset-0 brand-gradient opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_50%)] animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(220,38,38,0.15),transparent_50%)]" />
      {/* Moving diagonal stripes (subtle) */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, #111827 0, #111827 2px, transparent 2px, transparent 24px)",
          animation: "pm-slide 20s linear infinite",
        }}
      />
      {/* Floating particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <style>{`
        @keyframes pm-slide {
          0% { background-position: 0 0; }
          100% { background-position: 340px 0; }
        }
      `}</style>
    </div>
  );
}
