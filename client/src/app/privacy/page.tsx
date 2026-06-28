import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How StyleSense collects, uses, and protects your personal data.",
  alternates: { canonical: "https://stylesense.co.in/privacy" },
  openGraph: { title: "Privacy Policy | StyleSense", description: "How StyleSense collects, uses, and protects your personal data.", url: "https://stylesense.co.in/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1c1b] antialiased" style={{ fontFamily: "Inter, sans-serif" }}>
      <nav className="fixed top-0 w-full z-50 bg-[#fcf9f8]/80 backdrop-blur-xl border-b border-black/5">
        <div className="flex justify-between items-center px-6 md:px-[6%] py-4 max-w-[1440px] mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="StyleSense" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>StyleSense</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#747686]">
            <Link href="/privacy" className="text-[#002b92] font-semibold">Privacy</Link>
            <Link href="/terms" className="hover:text-[#002b92] transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-[#002b92] transition-colors">Contact</Link>
            <Link href="/about" className="hover:text-[#002b92] transition-colors">About</Link>
          </div>
          <Link href="/analysis" className="px-5 py-2 rounded-full text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}>Get Started</Link>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-6 md:px-[6%] max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Privacy Policy</h1>
          <p className="text-sm text-[#747686]">Last updated: June 27, 2026</p>
        </header>

        <div className="space-y-10 text-[15px] leading-relaxed text-[#434654]">

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Who We Are</h2>
            <p>StyleSense is operated by Ritul Patel, an independent sole proprietor based in India. For questions about this policy, contact <a href="mailto:ritul6740@gmail.com" className="text-[#002b92] underline">ritul6740@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account information:</strong> Email address, name, and profile photo (if you sign in with Google).</li>
              <li><strong>Uploaded images:</strong> Photos you submit for skin tone analysis.</li>
              <li><strong>Analysis results:</strong> Your detected skin tone, undertone, seasonal palette, and related data.</li>
              <li><strong>Wardrobe data:</strong> Products you save, closet items you upload, collections, and outfit builds.</li>
              <li><strong>Usage analytics:</strong> Pages visited, features used, and interactions (via PostHog).</li>
              <li><strong>Technical logs:</strong> Browser type, device, IP address, and error reports (via Sentry).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To perform AI skin tone analysis and generate personalized recommendations.</li>
              <li>To save your wardrobe, collections, and history for your use.</li>
              <li>To improve the product based on usage patterns.</li>
              <li>To identify and fix technical issues.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Image Storage</h2>
            <p className="mb-3">When you upload a photo for analysis, the image is stored in Cloudinary (a third-party image hosting service) and a URL is saved in our database alongside your analysis results.</p>
            <p className="mb-3 font-semibold text-[#1b1c1b]">Important: Uploaded images are currently NOT automatically deleted after analysis.</p>
            <p>Deleting an analysis record within the application removes the database entry but does not currently remove the original image from Cloudinary. We are working to improve this behavior. If you need an image removed, contact us directly.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Third-Party Services</h2>
            <p className="mb-3">StyleSense uses the following services that may process your data:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supabase:</strong> Authentication, database, and user management.</li>
              <li><strong>Cloudinary:</strong> Image storage for uploaded analysis photos.</li>
              <li><strong>Cloudflare:</strong> DNS, CDN, and security.</li>
              <li><strong>PostHog:</strong> Product analytics and session recording (inputs are masked).</li>
              <li><strong>Sentry:</strong> Error monitoring and performance tracking.</li>
              <li><strong>Vercel:</strong> Frontend hosting.</li>
              <li><strong>Render:</strong> Backend hosting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Cookies & Analytics</h2>
            <p>StyleSense uses PostHog for product analytics. PostHog uses local storage (not traditional cookies) to track anonymous usage. Session recording masks all form inputs. We do not sell your data or use it for advertising.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Your Rights</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access and view your stored data at any time through the application.</li>
              <li>Delete your account and associated application data from Settings.</li>
              <li>Request manual deletion of Cloudinary-stored images by contacting us.</li>
              <li>Export your analysis history through the application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Account Deletion</h2>
            <p>You can delete your account from the Settings page. This removes your profile, wardrobe, closet items, outfit builds, and collections from the application database. Analysis history is also cleared. However, images previously uploaded to Cloudinary may not be immediately removed from that service unless manually requested.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1b1c1b] mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Contact</h2>
            <p>For privacy-related questions: <a href="mailto:ritul6740@gmail.com" className="text-[#002b92] underline">ritul6740@gmail.com</a></p>
          </section>

        </div>
      </main>

      <footer className="bg-white border-t border-black/5 py-10 px-6 md:px-[6%]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-sm text-[#747686]">© 2026 StyleSense</span>
          <div className="flex gap-6 text-sm text-[#747686]">
            <Link href="/privacy" className="text-[#002b92] font-medium">Privacy</Link>
            <Link href="/terms" className="hover:text-[#002b92]">Terms</Link>
            <Link href="/contact" className="hover:text-[#002b92]">Contact</Link>
            <Link href="/about" className="hover:text-[#002b92]">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
