import type { ReactNode } from "react";
import styles from "./preview-embed.module.css";

export default function FeaturePreviewLayout({ children }: { children: ReactNode }) {
  return <div className={styles.embed} data-comparison-root>{children}</div>;
}
