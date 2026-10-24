import type { ReactNode } from "react";
import styles from "../features/preview-embed.module.css";

export default function SsrPreviewLayout({ children }: { children: ReactNode }) {
  return <div className={styles.embed} data-comparison-root>{children}</div>;
}
