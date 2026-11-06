import type { Order } from "./orders";
import styles from "./responsive-tables.module.css";

const statusClasses: Record<Order["status"], string> = {
  배송중: styles.shipping,
  준비중: styles.pending,
  배송완료: styles.delivered,
  취소: styles.cancelled,
};

export default function OrderStatus({ status }: { status: Order["status"] }) {
  return <span className={`${styles.status} ${statusClasses[status]}`}>{status}</span>;
}
