import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";


export const metadata: Metadata = {
  title: "StyleSense",
  description: "Your personal AI stylist. Upload an image to analyze your seasonal color palette and discover personalized outfits.",
  openGraph: {
    title: "StyleSense | AI Personal Stylist",
    description: "Your personal AI stylist. Discover your seasonal color palette and get outfit recommendations.",
    url: "https://www.stylesens.in",
    siteName: "StyleSense",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Text fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Material Symbols — preload + swap for immediate icon rendering */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" as="style" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body style={{ overflowX: "hidden" }}><Providers>{children}</Providers></body>
    </html>
  );
}
