import styles from "./analysis-ui.module.css";

type LoaderProps = {
  title?: string;
  text?: string;
};

export default function Loader({
  title = "Analyzing your skin tone...",
  text = "This takes just a moment.",
}: LoaderProps) {
  return (
    <div className={styles.loaderShell}>
      <div className={styles.loaderInner}>
        <div className={styles.loaderSpinner} aria-hidden="true" />
        <div className={styles.loaderTitle}>{title}</div>
        <div className={styles.loaderText}>{text}</div>
      </div>
    </div>
  );
}
