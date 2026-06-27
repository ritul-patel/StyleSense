import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About StyleSense",
  description: "StyleSense is an AI-powered personal styling platform helping people discover colors, outfits, and clothing that suit them.",
  alternates: { canonical: "https://stylesens.in/about" },
  openGraph: { title: "About StyleSense", description: "An AI-powered personal styling platform.", url: "https://stylesens.in/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1c1b] antialiased" style={{ fontFamily: "Inter, sans-serif" }}>
      <nav className="fixed top-0 w-full z-50 bg-[#fcf9f8]/80 backdrop-blur-xl border-b border-black/5">
        <div className="flex justify-between items-center px-6 md:px-[6%] py-4 max-w-[1440px] mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="StyleSense" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>StyleSense</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#747686]">
            <Link href="/privacy" className="hover:text-[#002b92] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#002b92] transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-[#002b92] transition-colors">Contact</Link>
            <Link href="/about" className="text-[#002b92] font-semibold">About</Link>
          </div>
          <Link href="/analysis" className="px-5 py-2 rounded-full text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}>Get Started</Link>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-6 md:px-[6%] max-w-3xl mx-auto">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#dde1ff] text-[#001452] rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            AI Personal Stylist
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>About StyleSense</h1>
          <p className="text-lg text-[#5a6060] leading-relaxed max-w-2xl">
            StyleSense is building an AI-powered personal styling platform that helps people discover colors, outfits, and clothing recommendations that suit them.
          </p>
        </header>

        <div className="space-y-12">

          {/* Mission */}
          <section className="bg-white rounded-2xl border border-black/5 p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>Our Mission</h2>
            <p className="text-[15px] text-[#434654] leading-relaxed">
              Most people struggle with knowing which colors suit them and which clothes work together. StyleSense solves this by combining AI skin tone analysis with curated product recommendations, giving everyone access to personalized styling guidance without needing a professional consultant.
            </p>
          </section>

          {/* What we do */}
          <section>
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>What StyleSense Does</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: "face", title: "Skin Tone Analysis", desc: "Detects your exact skin tone, Fitzpatrick type, and undertone from a single photo." },
                { icon: "palette", title: "Seasonal Color Typing", desc: "Maps your features to one of 12 seasonal sub-types to identify your best colors." },
                { icon: "checkroom", title: "Outfit Recommendations", desc: "Suggests complete outfits matched to your palette with links to buy each piece." },
                { icon: "shopping_bag", title: "Product Discovery", desc: "Curates clothing from real brands, filtered by your colors, budget, and style." },
                { icon: "favorite", title: "Wardrobe Management", desc: "Save products, build collections, upload closet items, and create outfit combos." },
                { icon: "insights", title: "Style Tracking", desc: "Keep a history of analyses and watch your wardrobe grow over time." },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl border border-black/5 p-5">
                  <div className="w-10 h-10 rounded-lg bg-[#dde1ff] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[#002b92] text-xl">{item.icon}</span>
                  </div>
                  <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                  <p className="text-xs text-[#5a6060] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Beta status */}
          <section className="bg-[#002b92]/5 border border-[#002b92]/10 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#002b92] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-xl">science</span>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>Currently in Beta</h3>
                <p className="text-sm text-[#434654] leading-relaxed">
                  StyleSense is actively being developed and improved based on user feedback. All features are free during the beta period. If you encounter issues or have suggestions, we welcome your input through the in-app feedback button or by contacting us directly.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center pt-4">
            <Link
              href="/analysis"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold hover:scale-[1.02] transition-transform"
              style={{ background: "linear-gradient(135deg, #002b92, #003ec7)", boxShadow: "0 10px 25px rgba(0,43,146,0.2)" }}
            >
              Try StyleSense Free
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </section>

        </div>
      </main>

      <footer className="bg-white border-t border-black/5 py-10 px-6 md:px-[6%]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-sm text-[#747686]">© 2026 StyleSense</span>
          <div className="flex gap-6 text-sm text-[#747686]">
            <Link href="/privacy" className="hover:text-[#002b92]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#002b92]">Terms</Link>
            <Link href="/contact" className="hover:text-[#002b92]">Contact</Link>
            <Link href="/about" className="text-[#002b92] font-medium">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
