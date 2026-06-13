type ColorChipProps = {
  label: string;
  variant: "best" | "avoid";
};

const variantClass: Record<ColorChipProps["variant"], string> = {
  best: "bg-green-100 text-green-800",
  avoid: "bg-red-100 text-red-700",
};

export default function ColorChip({ label, variant }: ColorChipProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${variantClass[variant]}`}>
      {label}
    </span>
  );
}
