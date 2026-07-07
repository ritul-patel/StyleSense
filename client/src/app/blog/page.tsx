import type { Metadata } from "next";
import BlogListClient from "./BlogListClient";

export const metadata: Metadata = {
  title: "Blog | StyleSense",
  description: "Fashion tips, color analysis guides, and styling advice from StyleSense.",
  alternates: { canonical: "https://stylesense.co.in/blog" },
  openGraph: {
    title: "Blog | StyleSense",
    description: "Fashion tips, color analysis guides, and styling advice.",
    url: "https://stylesense.co.in/blog",
  },
};

export default function BlogPage() {
  return <BlogListClient />;
}
