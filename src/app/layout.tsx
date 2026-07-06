import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ParcelMaadi — Fast Local Reliable Parcel & Goods Delivery",
  description:
    "Book parcel delivery, goods vehicles, water tankers, construction material and machinery rental in minutes. By HP Enterprise. Fast Local Reliable.",
  keywords: [
    "ParcelMaadi",
    "HP Enterprise",
    "parcel delivery",
    "courier",
    "goods vehicle",
    "water tanker",
    "construction material",
    "machinery rental",
    "Bangalore delivery",
    "Karnataka logistics",
  ],
  authors: [{ name: "HP Enterprise" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.webmanifest",
  applicationName: "ParcelMaadi",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ParcelMaadi" },
  openGraph: {
    title: "ParcelMaadi — Fast Local Reliable",
    description: "Parcel, courier, goods vehicles, water tankers & more. Book in 2 minutes.",
    siteName: "ParcelMaadi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ParcelMaadi — Fast Local Reliable",
    description: "Parcel, courier, goods vehicles, water tankers & more. Book in 2 minutes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "ParcelMaadi",
    description: "Fast Local Reliable parcel & goods delivery across Karnataka. Parcel, courier, goods vehicles, water tankers, construction material, machinery rental.",
    url: "https://parcelmaadi.com",
    telephone: "+91-9741433725",
    email: "parcelmaadipm@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Venkateshwara Nilaya, behind Hanuman Mandir, Nagenahalli",
      addressLocality: "Hosadurga, Chitradurga",
      addressRegion: "Karnataka",
      postalCode: "577515",
      addressCountry: "IN",
    },
    parentOrganization: { "@type": "Organization", name: "HP Enterprise", taxID: "29ANZPH4067Q1ZS" },
    areaServed: "Karnataka, India",
    priceRange: "₹₹",
  };
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
