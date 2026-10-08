import type { MetadataRoute } from "next";
import { getFallbackDomains } from "@/lib/fallback-domains";
import { ENV } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = ENV.appUrl;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // hub pages: every TLD × category combination present in the catalog
  const hubs = new Set<string>();
  for (const d of getFallbackDomains()) {
    hubs.add(`${base}/drops/${d.tld.replace(".", "")}/${d.category}`);
  }
  const hubRoutes: MetadataRoute.Sitemap = [...hubs].map((url) => ({
    url,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const domainRoutes: MetadataRoute.Sitemap = getFallbackDomains().map((d) => ({
    url: `${base}/domain/${d.id}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: d.flags.eduGov ? 0.9 : 0.7,
  }));

  return [...staticRoutes, ...hubRoutes, ...domainRoutes];
}
