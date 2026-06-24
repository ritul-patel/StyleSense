"use client";

import { useTheme } from "@/lib/theme-context";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "system", label: "System", icon: "desktop_windows" },
    { value: "light", label: "Light", icon: "light_mode" },
    { value: "dark", label: "Dark", icon: "dark_mode" },
  ] as const;

  return (
    <div className="flex bg-[#f6f3f2] dark:bg-[#303030] rounded-xl p-1 w-fit">
      {options.map(({ value, label, icon }) => {
        const isActive = theme === value;
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
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
