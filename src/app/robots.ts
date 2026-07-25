import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Raw artifact bodies are model output, not Benchlee content — keep them
      // out of the index while leaving them reachable for the iframe.
      disallow: "/api/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
