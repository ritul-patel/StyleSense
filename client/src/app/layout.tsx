import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StyleSense",
  description: "Upload an image and analyze it through Express and FastAPI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
