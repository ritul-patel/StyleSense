import { ReactNode } from "react";
import styles from "./analysis-ui.module.css";

type ResultCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export default function ResultCard({ title, children, className }: ResultCardProps) {
  return (
    <section className={`${styles.card} ${className || ""}`.trim()}>
      {title ? <h3 className={styles.cardTitle}>{title}</h3> : null}
      {children}
    </section>
  );
}
