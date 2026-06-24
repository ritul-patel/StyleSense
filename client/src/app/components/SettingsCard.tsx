"use client";

export default function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="group bg-white dark:bg-[#1b1c1b] rounded-[2rem] p-8 flex flex-col transition-all duration-500 shadow-[0_20px_40px_-10px_rgba(28,27,27,0.06)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border border-transparent dark:border-[#303030]"
    >
      <div className="mb-8">
        <h3
          className="text-2xl font-extrabold text-[#1b1c1b] dark:text-[#fcf9f8]"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-[#434654] dark:text-[#a0a0b8] text-sm mt-2">
            {description}
          </p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
