import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import FeedbackWidget from "./components/FeedbackWidget";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  metadataBase: new URL("https://stylesense.co.in"),
  title: {
    default: "StyleSense | AI Personal Stylist & Color Analysis",
    template: "%s | StyleSense",
  },
  description: "AI personal stylist that analyzes your skin tone, recommends colors, outfits, and clothing that suit you.",
  keywords: ["AI personal stylist", "skin tone analysis", "outfit recommendations", "color analysis", "seasonal color analysis", "wardrobe assistant"],
  authors: [{ name: "Ritul Patel" }],
  creator: "StyleSense",
  openGraph: {
    title: "StyleSense | AI Personal Stylist & Color Analysis",
    description: "AI personal stylist that analyzes your skin tone, recommends colors, outfits, and clothing that suit you.",
    url: "https://stylesense.co.in",
    siteName: "StyleSense",
    type: "website",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "StyleSense" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StyleSense | AI Personal Stylist & Color Analysis",
    description: "AI personal stylist that analyzes your skin tone, recommends colors, outfits, and clothing that suit you.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://stylesense.co.in",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#002b92",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "StyleSense",
                  url: "https://stylesense.co.in",
                  logo: "https://stylesense.co.in/logo.png",
                  founder: { "@type": "Person", name: "Ritul Patel" },
                  foundingLocation: { "@type": "Country", name: "India" },
                  description: "AI personal stylist that analyzes your skin tone, recommends colors, outfits, and clothing that suit you.",
                },
                {
                  "@type": "WebSite",
                  name: "StyleSense",
                  url: "https://stylesense.co.in",
                  description: "AI personal stylist that analyzes your skin tone, recommends colors, outfits, and clothing that suit you.",
                  publisher: { "@type": "Organization", name: "StyleSense" },
                },
              ],
            }),
          }}
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Text fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Material Symbols — preload + swap for immediate icon rendering */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" as="style" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
          <body style={{ overflowX: "hidden" }}>
        <Providers>{children}</Providers>
        <FeedbackWidget />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
