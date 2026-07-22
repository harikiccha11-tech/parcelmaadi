"use client";
import { useEffect, useState, useRef } from "react";

export function AnimatedCounter({ value, duration = 1500, prefix = "", suffix = "" }: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !animated.current) {
        animated.current = true;
        const start = 0;
        const end = value;
        const startTime = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          setCount(Math.floor(start + (end - start) * eased));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
