import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms of use for the StyleSense AI personal styling platform.",
  alternates: { canonical: "https://stylesense.co.in/terms" },
  openGraph: { title: "Terms & Conditions | StyleSense", description: "Terms of use for the StyleSense platform.", url: "https://stylesense.co.in/terms" },
};

export default function TermsPage() {
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
            <Link href="/terms" className="text-[#002b92] font-semibold">Terms</Link>
            <Link href="/contact" className="hover:text-[#002b92] transition-colors">Contact</Link>
            <Link href="/about" className="hover:text-[#002b92] transition-colors">About</Link>
          </div>
          <Link href="/analysis" className="px-5 py-2 rounded-full text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}>Get Started</Link>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-6 md:px-[6%] max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Terms & Conditions</h1>
          <p className="text-sm text-[#747686]">Last updated: June 27, 2026</p>
        </header>

        <div className="space-y-10 text-[15px] leading-relaxed text-[#434654]">

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>About StyleSense</h2>
            <p>StyleSense is an AI-powered personal styling platform that analyzes skin tone and undertone from uploaded photos to provide personalized color palette, outfit, and product recommendations.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Nature of Recommendations</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>AI-generated recommendations are informational and for personal reference only.</li>
              <li>Fashion and color recommendations are inherently subjective. Results may not suit every individual.</li>
              <li>StyleSense does not provide medical advice, dermatological guidance, or professional styling certification.</li>
              <li>Users remain fully responsible for their own purchasing decisions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Affiliate Links & Product Recommendations</h2>
            <p className="mb-3">StyleSense may display product links that include affiliate tracking. If you purchase a product through one of these links, StyleSense may receive a commission from the retailer at no additional cost to you.</p>
            <p>Product availability, pricing, and descriptions are provided by third-party retailers and may change without notice. StyleSense does not sell products directly.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You agree to provide accurate information when creating an account.</li>
              <li>You must be at least 13 years old to use StyleSense.</li>
              <li>One account per person. Automated or bot accounts are not permitted.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Upload images of other people without their consent.</li>
              <li>Use the service for any illegal or harmful purpose.</li>
              <li>Attempt to reverse-engineer, scrape, or overload the service.</li>
              <li>Redistribute analysis results commercially without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Intellectual Property</h2>
            <p className="mb-3">The StyleSense platform, including its design, branding, recommendation engine, and code, is owned by Ritul Patel.</p>
            <p>User-uploaded images remain the property of the user. By uploading, you grant StyleSense a limited license to process the image for analysis purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Limitation of Liability</h2>
            <p>StyleSense is provided "as is" without warranties of any kind. We do not guarantee the accuracy of AI analysis results, product availability, or uninterrupted service. To the maximum extent permitted by law, StyleSense and its operator are not liable for any indirect, incidental, or consequential damages arising from use of the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Service Availability</h2>
            <p>StyleSense is currently in beta. Features may change, be added, or be removed without prior notice. We aim to maintain uptime but do not guarantee availability.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction of courts in India.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Contact</h2>
            <p>Questions about these terms: <a href="mailto:ritul6740@gmail.com" className="text-[#002b92] underline">ritul6740@gmail.com</a></p>
          </section>

        </div>
      </main>

      <footer className="bg-white border-t border-black/5 py-10 px-6 md:px-[6%]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-sm text-[#747686]">© 2026 StyleSense</span>
          <div className="flex gap-6 text-sm text-[#747686]">
            <Link href="/privacy" className="hover:text-[#002b92]">Privacy</Link>
            <Link href="/terms" className="text-[#002b92] font-medium">Terms</Link>
            <Link href="/contact" className="hover:text-[#002b92]">Contact</Link>
            <Link href="/about" className="hover:text-[#002b92]">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
