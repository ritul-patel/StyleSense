"use client";

import { useTheme } from "@/lib/theme-context";
import { Monitor, Sun, Moon } from "lucide-react";

const THEME_ICONS = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ] as const;

  return (
    <div className="flex bg-[#f6f3f2] dark:bg-[#303030] rounded-xl p-1 w-fit">
      {options.map(({ value, label }) => {
        const isActive = theme === value;
        const IconComp = THEME_ICONS[value];
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold ${isActive
                ? "bg-white dark:bg-[#4a4a4a] text-[#002b92] dark:text-[#b7c4ff] shadow-sm"
                : "text-[#747686] dark:text-[#a0a0b8] hover:text-[#1b1c1b] dark:hover:text-[#ffffff]"
              }`}
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            <IconComp size={18} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
