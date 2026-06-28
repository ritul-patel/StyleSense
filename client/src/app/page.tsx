import type { Metadata } from "next";
import HomePageClient from "./components/HomePageClient";

export const metadata: Metadata = {
  title: "StyleSense | AI Personal Stylist & Color Analysis",
  description: "Upload a photo and discover your best colors, outfit recommendations, and clothing that suits you. Free AI personal styling.",
  alternates: { canonical: "https://stylesense.co.in" },
};

export default function HomePage() {
  return <HomePageClient />;
}
