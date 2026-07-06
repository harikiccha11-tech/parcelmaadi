import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "/";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}?policies=terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}?policies=privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}?policies=refund`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
