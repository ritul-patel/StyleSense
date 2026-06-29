"use client";

import { Link as ScrollLink, Element, Events, scrollSpy } from "react-scroll";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import HeroScannerCard from "./HeroScannerCard";
import { ScrollReveal, ScrollStagger, ScrollStaggerItem } from "@/components/motion";import { AppIcon } from "@/components/ui/AppIcon";


const NAV_OFFSET = -80; // offset for fixed navbar height
const SCROLL_DURATION = 800;
const SCROLL_EASING = "easeInOutQuart";

const NAV_ITEMS = [
  { to: "features", label: "Features" },
  { to: "how-it-works", label: "How It Works" },
  { to: "faq", label: "FAQ" },
];

export default function HomePageClient() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    Events.scrollEvent.register("begin", () => {});
    Events.scrollEvent.register("end", () => {});
    scrollSpy.update();

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      Events.scrollEvent.remove("begin");
      Events.scrollEvent.remove("end");
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1c1b] antialiased" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Nav ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/95 shadow-sm" : "bg-[#fcf9f8]/80"} backdrop-blur-xl border-b border-black/5`}>
        <div className="flex justify-between items-center px-6 md:px-[6%] py-4 max-w-[1440px] mx-auto">
          <ScrollLink
            to="hero"
            smooth
            duration={SCROLL_DURATION}
            offset={NAV_OFFSET}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <img src="/logo.png" alt="StyleSense" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>StyleSense</span>
          </ScrollLink>

          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <ScrollLink
                key={item.to}
                to={item.to}
                spy
                smooth
                duration={SCROLL_DURATION}
                offset={NAV_OFFSET}
                activeClass="!text-[#002b92] !opacity-100 font-semibold"
                className="text-[#1b1c1b]/70 font-medium hover:text-[#002b92] transition-colors text-sm cursor-pointer"
              >
                {item.label}
              </ScrollLink>
            ))}
            <NextLink href="/analysis" className="text-[#1b1c1b]/70 font-medium hover:text-[#002b92] transition-colors text-sm">
              Login
            </NextLink>
          </div>

          <NextLink
            href="/analysis"
            className="px-6 py-2.5 rounded-full text-white font-semibold text-sm hover:scale-[1.02] transition-transform"
            style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}
          >
            Get Started
          </NextLink>
        </div>
      </nav>

      <main className="pt-16">

        {/* ── Hero ── */}
        <Element name="hero">
          <section className="relative px-6 md:px-[6%] py-10 md:py-16 overflow-hidden max-w-[1440px] mx-auto min-h-[calc(100vh-4rem)] flex items-center">
            <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#dde1ff]/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-[#fedbca]/15 blur-[100px] pointer-events-none" />

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10 w-full">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#dde1ff] text-[#001452] rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                  <AppIcon name="auto_awesome" size={14} />
                  AI Personal Stylist
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Know your colors. Dress with confidence.
                </h1>
                <p className="text-[#5a6060] text-lg md:text-xl leading-relaxed max-w-xl mb-8">
                  Upload one photo and discover the colors, outfits, and clothing recommendations that suit you best.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <NextLink
                    href="/analysis"
                    className="px-8 py-4 rounded-full text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform text-lg"
                    style={{ background: "linear-gradient(135deg, #002b92, #003ec7)", boxShadow: "0 10px 25px rgba(0,43,146,0.25)" }}
                  >
                    Analyze My Photo
                    <AppIcon name="arrow_forward" />
                  </NextLink>
                  <NextLink
                    href="/discover"
                    className="px-8 py-4 rounded-full border-2 border-[#002b92] text-[#002b92] font-bold hover:bg-[#002b92]/5 transition-colors text-center"
                  >
                    Explore Recommendations
                  </NextLink>
                </div>
                <p className="text-sm text-[#5a6060]/70 mt-4">Free during beta. No credit card required.</p>
              </div>

              {/* Hero Preview: Live Scanner Card */}
              <div className="relative">
                <div className="absolute -inset-10 bg-[#002b92]/8 blur-[80px] rounded-full pointer-events-none hidden lg:block" />
                <HeroScannerCard />
              </div>
            </div>
          </section>
        </Element>

        {/* ── Features ── */}
        <Element name="features">
          <section className="bg-white py-24 px-6 md:px-[6%]">
            <div className="max-w-[1440px] mx-auto">
              <div className="text-center mb-16">
                <div className="text-[10px] font-bold uppercase text-[#002b92] tracking-[0.2em] mb-4">Features</div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Everything you need to dress better
                </h2>
              </div>
              <ScrollStagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: "face", title: "Skin Tone & Undertone Analysis", desc: "Upload one photo and get a breakdown of your skin tone, undertone, and Fitzpatrick type.", accent: "bg-[#dde1ff]" },
                  { icon: "palette", title: "Seasonal Color Palette", desc: "Find your color season and receive a palette of colors that complement your complexion.", accent: "bg-[#fef3c7]" },
                  { icon: "checkroom", title: "Outfit Recommendations", desc: "Get curated outfit ideas matched to your palette, with links to buy each piece.", accent: "bg-[#dcfce7]" },
                  { icon: "shopping_bag", title: "Curated Product Discovery", desc: "Browse clothing pre-matched to your colors. Filter by category, brand, and budget.", accent: "bg-[#fce7f3]" },
                  { icon: "favorite", title: "Save Favorites & Build Collections", desc: "Wishlist products, organize them into collections, and build outfit combinations.", accent: "bg-[#fff7ed]" },
                  { icon: "history", title: "Track Your Style Over Time", desc: "Keep a history of your analyses and see how your wardrobe grows.", accent: "bg-[#f0f9ff]" },
                ].map((f) => (
                  <ScrollStaggerItem key={f.title}>
                  <div className="h-full bg-[#fcf9f8] p-8 rounded-2xl border border-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className={`w-12 h-12 rounded-xl ${f.accent} flex items-center justify-center mb-5`}>
                      <AppIcon name={f.icon} size={24} className="text-[#002b92]" />
                    </div>
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>{f.title}</h3>
                    <p className="text-sm text-[#5a6060] leading-relaxed">{f.desc}</p>
                  </div>
                  </ScrollStaggerItem>
                ))}
              </ScrollStagger>
            </div>
          </section>
        </Element>

        {/* ── How It Works ── */}
        <Element name="how-it-works">
          <section className="py-24 px-6 md:px-[6%]">
            <div className="max-w-[1440px] mx-auto">
              <div className="text-center mb-16">
                <div className="text-[10px] font-bold uppercase text-[#002b92] tracking-[0.2em] mb-4">How It Works</div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Photo to personalized style in three steps
                </h2>
              </div>
              <ScrollStagger className="grid md:grid-cols-3 gap-8">
                {[
                  { step: "01", icon: "cloud_upload", title: "Upload a Photo", desc: "Take a selfie or upload a clear portrait. Natural lighting works best, no filters needed." },
                  { step: "02", icon: "auto_awesome", title: "Get Your Results", desc: "StyleSense identifies your skin tone, undertone, and color season. Results show up in about 10 seconds." },
                  { step: "03", icon: "style", title: "Shop & Build Your Wardrobe", desc: "Browse outfit recommendations and product picks. Save what you like and build your collections." },
                ].map((s) => (
                  <ScrollStaggerItem key={s.step}>
                  <div className="relative h-full bg-white p-8 rounded-2xl border border-black/5 shadow-sm">
                    <span className="text-[64px] font-black text-[#002b92]/5 absolute top-4 right-6" style={{ fontFamily: "Manrope, sans-serif" }}>{s.step}</span>
                    <div className="w-12 h-12 rounded-xl bg-[#002b92] flex items-center justify-center mb-5">
                      <AppIcon name={s.icon} size={24} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>{s.title}</h3>
                    <p className="text-sm text-[#5a6060] leading-relaxed">{s.desc}</p>
                  </div>
                  </ScrollStaggerItem>
                ))}
              </ScrollStagger>
            </div>
          </section>
        </Element>

        {/* ── What You Get ── */}
        <Element name="what-you-get">
          <section className="bg-[#1b1c1b] py-20 px-6 md:px-[6%]">
            <div className="max-w-[1440px] mx-auto">
              <div className="text-center mb-14">
                <div className="text-[10px] font-bold uppercase text-[#dde1ff] tracking-[0.2em] mb-4">After Your Analysis</div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
                  What you get
                </h2>
              </div>
              <ScrollStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: "gradient", label: "Your color palette", desc: "A set of colors that complement your skin. Use it as a reference when shopping online or in-store." },
                  { icon: "checkroom", label: "Outfit ideas", desc: "Complete looks built around your palette, with real products you can purchase." },
                  { icon: "diamond", label: "Material & accessory guidance", desc: "Which fabrics, metals, and textures pair well with your complexion." },
                  { icon: "bookmark", label: "A personal wardrobe", desc: "Save products, organize collections, and build outfits at your own pace." },
                ].map((item) => (
                  <ScrollStaggerItem key={item.label}>
                  <div className="h-full bg-white/5 border border-white/10 rounded-2xl p-6">
                    <AppIcon name={item.icon} size={24} className="text-[#dde1ff] mb-4 block" />
                    <h3 className="text-white font-bold mb-2">{item.label}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                  </ScrollStaggerItem>
                ))}
              </ScrollStagger>
            </div>
          </section>
        </Element>

        {/* ── FAQ ── */}
        <Element name="faq">
          <section className="py-24 px-6 md:px-[6%]">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-16">
                <div className="text-[10px] font-bold uppercase text-[#002b92] tracking-[0.2em] mb-4">FAQ</div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Questions & answers
                </h2>
              </div>
              <div className="space-y-4">
                {[
                  { q: "Is StyleSense free?", a: "Yes, completely free during beta. No credit card needed." },
                  { q: "What kind of photo works best?", a: "A clear, front-facing portrait with even lighting. Avoid sunglasses, heavy makeup, or strong shadows. Your face should fill most of the frame." },
                  { q: "How long does it take?", a: "About 10 seconds from upload to results." },
                  { q: "Does it work on mobile?", a: "Yes. Works on any modern browser across phone, tablet, and desktop." },
                  { q: "Do I need an account?", a: "Not for a quick analysis. But an account lets you save results, build a wardrobe, and access your history." },
                  { q: "Can I delete my data?", a: "Yes. Delete your account and all associated data from Settings at any time." },
                ].map((item) => (
                  <details key={item.q} className="bg-white rounded-2xl border border-black/5 p-6 group">
                    <summary className="flex items-center justify-between cursor-pointer font-bold text-[#1b1c1b] list-none">
                      {item.q}
                      <AppIcon name="expand_more" className="text-[#747686] group-open:rotate-180 transition-transform" />
                    </summary>
                    <p className="mt-4 text-sm text-[#5a6060] leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </Element>

        {/* ── Final CTA ── */}
        <section className="px-6 md:px-[6%] py-24">
          <ScrollReveal className="max-w-[1440px] mx-auto">
            <div className="rounded-[2rem] p-12 md:p-20 text-center text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Your style, simplified
                </h2>
                <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                  Upload one photo to discover your best colors, get outfit ideas, and find clothing recommendations in seconds.
                </p>
                <NextLink
                  href="/analysis"
                  className="inline-flex items-center gap-2 bg-white text-[#002b92] px-10 py-5 rounded-full font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg"
                >
                  Get Started Free
                  <AppIcon name="arrow_forward" />
                </NextLink>
              </div>
            </div>
          </ScrollReveal>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-black/5 py-12 px-6 md:px-[6%]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <NextLink href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="StyleSense" className="w-6 h-6 object-contain" />
              <span className="text-lg font-bold tracking-tight text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>StyleSense</span>
            </NextLink>
            <p className="text-sm text-[#747686] mt-1">Your AI personal stylist</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#747686]">
            <NextLink href="/discover" className="hover:text-[#002b92] transition-colors">Discover</NextLink>
            <NextLink href="/analysis" className="hover:text-[#002b92] transition-colors">Analysis</NextLink>
            <ScrollLink to="faq" smooth duration={SCROLL_DURATION} offset={NAV_OFFSET} className="hover:text-[#002b92] transition-colors cursor-pointer">FAQ</ScrollLink>
            <NextLink href="/about" className="hover:text-[#002b92] transition-colors">About</NextLink>
            <NextLink href="/privacy" className="hover:text-[#002b92] transition-colors">Privacy Policy</NextLink>
            <NextLink href="/terms" className="hover:text-[#002b92] transition-colors">Terms</NextLink>
            <NextLink href="/contact" className="hover:text-[#002b92] transition-colors">Contact</NextLink>
          </div>
          <div className="text-sm text-[#747686]">© 2026 StyleSense</div>
        </div>
      </footer>

    </div>
  );
}
