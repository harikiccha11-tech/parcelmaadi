"use client";
import { useRef, useState, useEffect } from "react";

interface ServiceVideoProps {
  videoUrl?: string;
  imageUrl: string;
  serviceName: string;
  overlay?: number;
  children?: React.ReactNode;
  className?: string;
}

// Clean background: HD image always visible, video plays on top if it loads.
// Minimal overlay — only a subtle bottom gradient for text readability.
export function ServiceVideoBackground({
  videoUrl,
  imageUrl,
  serviceName,
  overlay = 0,
  children,
  className = "",
}: ServiceVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    const handleLoaded = () => setVideoLoaded(true);
    const handleError = () => setVideoError(true);
    v.addEventListener("loadeddata", handleLoaded);
    v.addEventListener("error", handleError);
    v.play().catch(() => {});
    return () => {
      v.removeEventListener("loadeddata", handleLoaded);
      v.removeEventListener("error", handleError);
    };
  }, [videoUrl]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* HD image — ALWAYS visible */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={serviceName}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Video — fades in on top if it loads successfully */}
      {videoUrl && !videoError && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={imageUrl}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Subtle bottom gradient only — keeps images clearly visible */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}
