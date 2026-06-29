import type { Metadata } from "next";
import Link from "next/link";import { AppIcon } from "@/components/ui/AppIcon";


export const metadata: Metadata = {
  title: "Contact StyleSense",
  description: "Get in touch with StyleSense for support, feedback, or partnership inquiries.",
  alternates: { canonical: "https://stylesense.co.in/contact" },
  openGraph: { title: "Contact StyleSense", description: "Get in touch with the StyleSense team.", url: "https://stylesense.co.in/contact" },
};

export default function ContactPage() {
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
            <Link href="/contact" className="text-[#002b92] font-semibold">Contact</Link>
            <Link href="/about" className="hover:text-[#002b92] transition-colors">About</Link>
          </div>
          <Link href="/analysis" className="px-5 py-2 rounded-full text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}>Get Started</Link>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-6 md:px-[6%] max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Contact</h1>
          <p className="text-lg text-[#5a6060]">Questions, feedback, or partnership inquiries? Reach out below.</p>
        </header>

        <div className="bg-white rounded-2xl border border-black/5 p-8 md:p-10 shadow-sm space-y-8">
          {/* Contact card */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>Ritul Patel</h2>
              <p className="text-sm text-[#5a6060] mb-1">Founder & Developer</p>
              <p className="text-sm text-[#5a6060] mb-6">India</p>

              <div className="space-y-4">
                <a href="mailto:ritul6740@gmail.com" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-[#dde1ff] flex items-center justify-center">
                    <AppIcon name="mail" size={20} className="text-[#002b92]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block">Email</span>
                    <span className="text-sm font-medium text-[#002b92] group-hover:underline">ritul6740@gmail.com</span>
                  </div>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#747686] mb-4">I can help with</h3>
              <ul className="space-y-3">
                {[
                  { icon: "support_agent", text: "Technical support" },
                  { icon: "bug_report", text: "Bug reports" },
                  { icon: "person", text: "Account issues" },
                  { icon: "shield", text: "Privacy questions" },
                  { icon: "handshake", text: "Partnership inquiries" },
                  { icon: "chat", text: "General questions" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <AppIcon name={item.icon} size={18} className="text-[#747686]" />
                    <span className="text-sm text-[#434654]">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-black/5 pt-6">
            <p className="text-sm text-[#747686]">
              I typically respond within 24 to 48 hours. For urgent issues, please include &quot;Urgent&quot; in the subject line.
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-black/5 py-10 px-6 md:px-[6%]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-sm text-[#747686]">© 2026 StyleSense</span>
          <div className="flex gap-6 text-sm text-[#747686]">
            <Link href="/privacy" className="hover:text-[#002b92]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#002b92]">Terms</Link>
            <Link href="/contact" className="text-[#002b92] font-medium">Contact</Link>
            <Link href="/about" className="hover:text-[#002b92]">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
