import Link from "next/link";
import { AppIcon } from "@/components/ui/AppIcon";

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  isCard?: boolean;
};

export default function EmptyState({ icon, title, description, actionLabel, actionHref, isCard = false }: EmptyStateProps) {
  return (
    <div className={`py-20 flex flex-col items-center justify-center text-center ${isCard ? "bg-white dark:bg-[#1b1c1b] rounded-[2rem] border border-[#f0edec] dark:border-[#303030]" : ""}`}>
      <AppIcon name={icon} size={isCard ? 56 : 48} className="text-[#dcd9d8] dark:text-[#434654] mb-4" />
      <h3 className={`${isCard ? "text-xl font-bold mb-2" : "text-xl font-bold mb-2"}`}>{title}</h3>
      <p className={`text-[#747686] text-sm ${actionLabel ? "mb-6" : ""}`}>{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="px-6 py-3 bg-[#1b1c1b] text-white dark:bg-white dark:text-[#1b1c1b] rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
