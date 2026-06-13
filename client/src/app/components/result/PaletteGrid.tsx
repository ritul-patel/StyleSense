import type { PaletteItem } from "./types";

type PaletteGridProps = {
  colors?: PaletteItem[];
  season?: string;
};

function ColorChip({ color, index }: { color: PaletteItem; index: number }) {
  const safeHex = typeof color.hex === "string" ? color.hex : "#7A7A7A";
  return (
    <article className="group cursor-pointer rounded-2xl bg-white p-3 shadow-md transition duration-300 hover:scale-[1.02]">
      <div
        className="mb-3 h-28 w-full rounded-xl md:h-32"
        style={{ backgroundColor: safeHex }}
      />
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-[#2d3433]">
          {color.name || `Tone ${String(index + 1).padStart(2, "0")}`}
        </span>
        <span className="font-mono text-xs text-[#757c7b]">{safeHex}</span>
      </div>
    </article>
  );
}

export default function PaletteGrid({ colors = [], season = "Autumn" }: PaletteGridProps) {
  const visibleColors = colors.slice(0, 4);

  return (
    <section className="mb-14 md:mb-16 w-full">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#2d3433]">Palette Grid</h3>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#757c7b]">{season}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {visibleColors.map((color, i) => (
          <ColorChip key={i} color={color} index={i} />
        ))}
      </div>
    </section>
  );
}
