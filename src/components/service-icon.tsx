"use client";
import {
  Package, Mail, Truck, Droplets, HardHat, Wrench, ShoppingCart, Siren,
  type LucideIcon,
} from "lucide-react";

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  Package, Mail, Truck, Droplets, HardHat, Wrench, ShoppingCart, Siren,
};

export function ServiceIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && SERVICE_ICONS[name]) || Package;
  return <Icon className={className} />;
}

export const SERVICE_ICON_NAMES = Object.keys(SERVICE_ICONS);
