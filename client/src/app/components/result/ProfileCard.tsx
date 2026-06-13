type ProfileCardProps = {
  skinTone: string;
  undertone: string;
  confidence: number;
  season: string;
  hex: string;
  rgb: [number, number, number];
};

function toTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default function ProfileCard({ skinTone, undertone, confidence, season, hex, rgb }: ProfileCardProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <article className="relative overflow-hidden rounded-3xl bg-[#f2f4f3] p-8 shadow-[0_20px_56px_rgba(12,15,14,0.1)] transition-transform duration-300 hover:-translate-y-1 md:col-span-2">
        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#5a6060]">
            {toTitleCase(season)} Profile
          </h2>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#f6decb] px-4 py-1.5 text-xs font-bold tracking-wide text-[#5f4f41]">
              {toTitleCase(skinTone)} Skin
            </span>
            <span className="rounded-full bg-[#fedbca] px-4 py-1.5 text-xs font-bold tracking-wide text-[#654c40]">
              {toTitleCase(undertone)} Undertone
            </span>
            <span className="rounded-full bg-[#dde4e3] px-4 py-1.5 text-xs font-bold tracking-wide text-[#2d3433]">
              {confidence}% Confidence
            </span>
          </div>
        </div>

        <div className="mt-12 flex items-end justify-between gap-5">
          <p className="max-w-xl text-lg leading-relaxed text-[#2d3433]">
            Your profile indicates a {toTitleCase(season)} match with RGB ({rgb.join(", ")}) and dominant color {hex}.
          </p>
          <div
            className="hidden h-[72px] w-[72px] rounded-2xl border border-white/80 shadow-[inset_0_0_0_1px_rgba(45,52,51,0.14)] sm:block"
            style={{ backgroundColor: hex }}
          />
        </div>
      </article>

      <article className="rounded-3xl bg-[#ebeeed] p-6 shadow-[0_20px_50px_rgba(12,15,14,0.1)]">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#5a6060]">Primary Tone</div>
        <div className="h-44 w-full rounded-2xl shadow-[inset_0_0_0_1px_rgba(45,52,51,0.15)]" style={{ backgroundColor: hex }} />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-base font-semibold text-[#2d3433]">Detected Hex</span>
          <span className="font-mono text-sm text-[#757c7b]">{hex}</span>
        </div>
      </article>
    </div>
  );
}
