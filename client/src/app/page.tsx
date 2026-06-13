import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fashion AI | Discover Your Perfect Colors",
  description:
    "Unlock your natural radiance with AI-powered personal color analysis and wardrobe recommendations.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased">

      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="flex justify-between items-center px-[6%] py-4">
          <div className="text-2xl font-black tracking-tighter text-[#1b1c1b]">Fashion AI</div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-[#002b92] font-bold border-b-2 border-[#002b92] transition-all" href="/analysis">Analysis</Link>
            <Link className="text-[#1b1c1b] font-medium opacity-80 hover:opacity-100 hover:text-[#002b92] transition-all" href="/history">History</Link>
            <Link className="text-[#1b1c1b] font-medium opacity-80 hover:opacity-100 hover:text-[#002b92] transition-all" href="/wardrobe">Wardrobe</Link>
            <a className="text-[#1b1c1b] font-medium opacity-80 hover:opacity-100 hover:text-[#002b92] transition-all" href="#">Pricing</a>
          </div>
          <Link className="signature-gradient text-white px-6 py-2.5 rounded-full font-semibold text-sm active:scale-95 transition-all" href="/analysis">
            Upload Photo
          </Link>
        </div>
      </nav>

      <main className="pt-24">

        {/* ── Hero ── */}
        <section className="relative px-[6%] py-20 md:py-32 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                Next-Gen Color Theory
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight mb-8">
                Discover Your Perfect Colors with AI
              </h1>
              <p className="text-on-surface-variant text-lg md:text-xl leading-relaxed max-w-xl mb-14">
                Unlock your natural radiance. Our proprietary Atelier Engine analyzes your features to curate a bespoke wardrobe palette that complements your unique skin tone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col gap-2">
                  <Link
                    className="signature-gradient text-on-primary px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                    href="/analysis"
                  >
                    Start Analysis
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                  <p className="text-sm text-on-surface-variant opacity-70 text-center mt-2">Takes 10 seconds • No signup required</p>
                </div>
                <div className="flex flex-col">
                  <button className="border-2 border-[#003ec7] text-[#003ec7] px-8 py-4 rounded-full font-bold hover:bg-[#003ec7]/5 transition-colors">
                    View Example
                  </button>
                </div>
              </div>
            </div>

            {/* Card */}
            <div className="relative group lg:scale-110">
              <div className="absolute -inset-20 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="relative bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
                      <Image alt="User Profile" className="w-full h-full object-cover" height={40} width={40}
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5gOlrUcye5RCErslpWkYuzRzTp0FstysAJbegHEA8VxPqHll_dMM3SILKUsbKUaPfqfMkdE4hIs6XecpZTb2oA68F4cJDrC_o8eP5DbZYmfly7rkYoCVHh5xP0cC9FBuzGKGtAQUt2U20yHzHF-b9GDuJqwv9frC_FxTnuhkKxmy3DzAQ20FAa2BiO1i2D1T0jyk5j81Qyzem-GI75e2d4r5l4ZVOgwjs5Zhw8WCSuDpp_6wczQN_kb2bWuBp8DHo8W2sB0bvy3w"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Analysis Complete</div>
                      <div className="text-xs text-on-surface-variant">Profile: Elena S.</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                </div>
                <div className="space-y-6">
                  <div className="p-4 bg-surface-container-low rounded-lg">
                    <div className="text-[10px] uppercase font-black text-on-surface-variant mb-2 tracking-widest">Primary Palette</div>
                    <div className="flex gap-2">
                      <div className="h-12 w-full rounded-md bg-[#843b23]" />
                      <div className="h-12 w-full rounded-md bg-[#c27c3e]" />
                      <div className="h-12 w-full rounded-md bg-[#4d5d30]" />
                      <div className="h-12 w-full rounded-md bg-[#e9c46a]" />
                      <div className="h-12 w-full rounded-md bg-[#f4a261]" />
                    </div>
                    <div className="mt-3 flex justify-between items-end">
                      <span className="text-2xl font-black text-primary italic">Deep Autumn</span>
                      <span className="text-xs font-medium opacity-60">98% Confidence</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-surface-container rounded-lg overflow-hidden group/item">
                      <Image alt="Outfit Suggestion 1" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" height={220} width={220}
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBELR3BKrB3NMEOcqI3fGDJpaSsLeZPw4WpUAs3O8mDpw1yAta9t4_CAX9l9Mbkq8rqM4PhWVXHHD_ZNQEjjkqYSBymPuzWmPCdSSHqKcYnklaKEQ4bYciXaRLV-zEzThdXIEIp_v2DY_0TbK1abBVF8bPL-MG1py2ywp4n5QL9BzmrPwPj5yCt-4A4oTzR7iCF62s4AHZa1lr0w-8VMoYiCnySfuwiYGdgUhdEPMq9CrIr8b1IXraM_MLwzQOU1UdYPrNSIKXxfkk"
                      />
                    </div>
                    <div className="aspect-square bg-surface-container rounded-lg overflow-hidden group/item">
                      <Image alt="Outfit Suggestion 2" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" height={220} width={220}
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsPIwoop3kMVnb8BLBMnazUaVp1V_OjVTCDyGKf9bp8yVWzv2a2aticry0eSh6zUCTkTT_pg5MmtyXQ711s0FWqbU5m2AQsVMj1aAFX_1p9LucvyK75n4QJVGe6QXApFFkBSN6G0oaqFnaDYcPMcgGPLmTKZiXcS5cT3wCSNZyEKhbee-Lt4k5YsQdqcH65xVFzHtgIGwJz8ZyCIARosj42iLAsoFGPnS0l1vnWukXzk28DGz9-05IIb8biLQdLQ3r-jWfUt0aMVo"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Three Steps ── */}
        <section className="bg-surface-container-low py-24 px-[6%]">
          <div className="text-center mb-16">
            <div className="text-sm font-black uppercase text-primary tracking-[0.2em] mb-4">The Process</div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Three Steps to Radiance</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest p-10 rounded-xl hover:scale-[1.02] transition-all group hover:shadow-2xl">
              <div className="w-14 h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
                <span className="material-symbols-outlined text-4xl">upload_file</span>
              </div>
              <h3 className="text-xl font-bold mb-4">1. Upload</h3>
              <p className="text-on-surface-variant leading-relaxed">Share a well-lit portrait. Our privacy-first AI processes your features locally before generating results.</p>
            </div>
            <div className="bg-surface-container-lowest p-10 rounded-xl hover:scale-[1.02] transition-all group hover:shadow-2xl">
              <div className="w-14 h-14 signature-gradient text-on-primary rounded-xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
                <span className="material-symbols-outlined text-4xl">insights</span>
              </div>
              <h3 className="text-xl font-bold mb-4">2. Analyze</h3>
              <p className="text-on-surface-variant leading-relaxed">The Atelier Engine cross-references skin undertones, eye contrast, and hair depth against 4,000+ color profiles.</p>
            </div>
            <div className="bg-surface-container-lowest p-10 rounded-xl hover:scale-[1.02] transition-all group hover:shadow-2xl">
              <div className="w-14 h-14 bg-tertiary-container text-on-tertiary rounded-xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
                <span className="material-symbols-outlined text-4xl">stylus_note</span>
              </div>
              <h3 className="text-xl font-bold mb-4">3. Recommend</h3>
              <p className="text-on-surface-variant leading-relaxed">Receive a permanent digital lookbook with palette-matched clothing, makeup, and accessory recommendations.</p>
            </div>
          </div>
        </section>

        {/* ── Digital Atelier ── */}
        <section className="py-24 px-[6%]">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="text-sm font-black uppercase text-tertiary tracking-[0.2em] mb-4">Live Preview</div>
              <h2 className="text-4xl font-extrabold mb-6 tracking-tight">Your Digital Atelier</h2>
              <p className="text-on-surface-variant text-lg mb-8">Stop guessing in the dressing room. Our real-time dashboard gives you the confidence to wear colors you never thought possible.</p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-medium">Sub-season precision (e.g., Deep Autumn)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-medium">Hex codes for online shopping</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-medium">Customizable outfit capsules</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2 bg-surface-container p-1 rounded-xl">
                <div className="relative rounded-lg overflow-hidden h-64">
                  <Image alt="Fashion Grid 1" className="w-full h-full object-cover" fill sizes="60vw"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDumzVIg1jwocNpIv4onftjAa2pXIHOGo-LwnmpeM7t7yZCosBxOqXReVCKQ8Wts4HTa8dJsCxk0dEWdjKFdFL7HNsqr6OVP7owTbTwo10JZXPXQyg2zLxfT6dCqvLvClnKUIh_xeYIM07wEsQ34G1vAjrXvYqSscf0ybBDQm7zHoeTeeXs4hL0oF0lnZX6c1-WSuRheHpdnZRp3X5qDLiKaMGzoPtLvOI_Rh40P_ib4BBuz0_xreIi8XyaRt1FZ9uDK2VIkv9Arhw"
                  />
                  <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold">
                    WARM PALETTE SELECTION
                  </div>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl overflow-hidden">
                <Image alt="Fashion Grid 2" className="w-full h-full object-cover" height={240} width={240}
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeRBEibPG4_jcvhvIQhGHqismIFSHrpgMmqiQY7vZJ6YHxs4S3KykWnvrATLYD-irQaPT0To8CVPCQNFJ5E3wNQ2r3d38KSCQ3nQChHucAIPX60HzOjfoI_vkaVLgNoPU_VFUYuedQQ-LV2hszPyNag-zSOe_8eEOGUxNwzfnIEf9JXrn7C-JM5mikxGL4s3ACS6Mu7i91vFu-D1OYsmFmhll9umCBNHCkdwIgn_v2KlNnJ3k7nBGCTKsIFp-AtN5AJ6Iaxj2JXNU"
                />
              </div>
              <div className="bg-surface-container rounded-xl overflow-hidden h-48">
                <Image alt="Fashion Grid 3" className="w-full h-full object-cover" height={192} width={240}
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwFUFlRF-UtN1buey_8xLWA3mjHiXbu_2YivBKnteXFD78UeEOTRP6wzmZsU06P2b6StxkS5a0cVmRSCsJ64uqU5MVxNMOjv9gJyYrWa9u7Fb6FKFc5quXildcqCfaHaexTY1e9Vl17fOd5N3iaXZ2svot_HiEcU0ttsE484KSyLzb1laPoAf3gC34DTbjhj8CqPqTdI1dSiJUvuATxQW0yhMzR2A4yvQ2v893Y0gtAd5B1KiwgPQIXTuTwJPaPpVW75QRyFjILNE"
                />
              </div>
              <div className="col-span-2 bg-surface-container-highest p-8 rounded-xl flex flex-col justify-center">
                <div className="text-3xl font-black italic mb-2">Autumn / 24</div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#5d4037]" />
                  <div className="w-8 h-8 rounded-full bg-[#8d6e63]" />
                  <div className="w-8 h-8 rounded-full bg-[#d7ccc8]" />
                  <div className="w-8 h-8 rounded-full bg-[#3e2723]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="px-[6%] py-24">
          <div className="signature-gradient rounded-[2rem] p-12 md:p-24 text-center text-on-primary relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
              </svg>
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-8">Ready to upgrade your style?</h2>
              <p className="text-on-primary-container text-lg md:text-xl mb-12 max-w-2xl mx-auto opacity-90">
                Join over 50,000 style enthusiasts who have discovered their perfect color palette with AI precision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link className="bg-surface-bright text-primary px-10 py-5 rounded-full font-black hover:scale-105 transition-transform" href="/analysis">
                  Try Now
                </Link>
                <button className="border-2 border-on-primary/30 text-on-primary px-10 py-5 rounded-full font-black hover:bg-on-primary/10 transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-surface-container-low w-full py-20">
        <div className="flex flex-col md:flex-row justify-between items-center px-[6%]">
          <div className="mb-8 md:mb-0">
            <div className="text-xl font-bold text-[#1b1c1b] mb-2">Fashion AI</div>
            <p className="text-on-surface-variant text-sm max-w-xs">Elevating personal style through high-precision computational aesthetics.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex gap-6">
              <a className="text-on-surface-variant opacity-70 hover:text-[#1b1c1b] transition-opacity text-sm" href="#">Privacy Policy</a>
              <a className="text-on-surface-variant opacity-70 hover:text-[#1b1c1b] transition-opacity text-sm" href="#">Terms of Service</a>
              <a className="text-on-surface-variant opacity-70 hover:text-[#1b1c1b] transition-opacity text-sm" href="#">Contact</a>
            </div>
            <div className="text-on-surface-variant opacity-70 text-sm">© 2026 Fashion AI Atelier. All rights reserved.</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
