import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/contact", "/privacy", "/terms"],
        disallow: [
          "/admin",
          "/admin/*",
          "/login",
          "/signup",
          "/analysis",
          "/loading",
          "/result",
          "/discover",
          "/wardrobe",
          "/history",
          "/settings",
          "/outfit/*",
          "/auth-check/*",
          "/api/*",
          "/monitoring",
        ],
      },
    ],
    sitemap: "https://stylesens.in/sitemap.xml",
  };
}
