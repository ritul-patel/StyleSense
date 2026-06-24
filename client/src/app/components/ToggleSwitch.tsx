"use client";

export default function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="w-10 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0"
      style={{ background: on ? "#003ec7" : "#e5e2e1" }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: on ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}
