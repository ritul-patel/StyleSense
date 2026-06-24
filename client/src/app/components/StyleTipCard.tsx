import { TipsAndUpdates } from "lucide-react";
export default function StyleTipCard({ tip }: { tip: string }) {
  return (
    <div className="snap-start flex-shrink-0 w-64 p-4 rounded-2xl bg-white dark:bg-[#1b1c1b] shadow-sm border border-[#f0edec] dark:border-[#303030] flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-[#f4f2f1] dark:bg-[#303030] flex items-center justify-center flex-shrink-0">
        <TipsAndUpdates className="text-[16px] text-[#843b23] dark:text-[#c27c3e]" />
      </div>
      <p className="text-xs font-medium text-[#434654] dark:text-[#dcd9d8] leading-relaxed">
        {tip}
      </p>
    </div>
  );
}
