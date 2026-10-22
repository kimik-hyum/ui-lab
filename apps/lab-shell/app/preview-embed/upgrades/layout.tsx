import type { ReactNode } from "react";
import styles from "./upgrade-embed.module.css";

export default function UpgradePreviewLayout({ children }: { children: ReactNode }) {
  return <div className={styles.embed} data-upgrade-root>{children}</div>;
}
