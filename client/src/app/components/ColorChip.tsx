import styles from "./analysis-ui.module.css";

function getChipColor(label: string) {
  const value = label.toLowerCase();

  if (value.includes("white")) return "#f8f5ec";
  if (value.includes("black") || value.includes("charcoal")) return "#2f3640";
  if (value.includes("gray") || value.includes("grey") || value.includes("silver")) return "#bcc4ce";
  if (value.includes("blue") || value.includes("sapphire") || value.includes("cobalt")) return "#6b8ee6";
  if (value.includes("teal")) return "#4f9f97";
  if (value.includes("green") || value.includes("olive") || value.includes("emerald") || value.includes("jade")) {
    return "#6c9f72";
  }
  if (value.includes("pink") || value.includes("fuchsia")) return "#de7cad";
  if (value.includes("peach") || value.includes("coral")) return "#e78f73";
  if (value.includes("orange") || value.includes("terracotta") || value.includes("copper")) return "#cb7c4b";
  if (value.includes("yellow") || value.includes("mustard") || value.includes("gold")) return "#d2ad46";
  if (value.includes("purple") || value.includes("lavender") || value.includes("plum") || value.includes("burgundy")) {
    return "#8c6ac8";
  }
  if (value.includes("red") || value.includes("ruby")) return "#cb5f64";
  if (value.includes("beige") || value.includes("khaki")) return "#c7ac82";

  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 55% 68%)`;
}

type ColorChipProps = {
  color: string;
  variant?: "best" | "avoid";
};

export default function ColorChip({ color, variant = "best" }: ColorChipProps) {
  return (
    <div className={`${styles.chip} ${variant === "avoid" ? styles.chipAvoid : ""}`}>
      <span className={styles.chipSwatch} style={{ backgroundColor: getChipColor(color) }} aria-hidden="true" />
      <span className={`${styles.chipLabel} ${variant === "avoid" ? styles.chipLabelAvoid : ""}`}>{color}</span>
    </div>
  );
}
