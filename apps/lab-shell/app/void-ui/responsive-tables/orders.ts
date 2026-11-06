export const orders = [
  { id: "ORD-1048", product: "포터블 테이블 램프", customer: "김하늘", amount: 68000, status: "배송중", date: "2026.10.28", manager: "서윤" },
  { id: "ORD-1047", product: "리넨 데스크 매트", customer: "이도현", amount: 32000, status: "준비중", date: "2026.10.28", manager: "지호" },
  { id: "ORD-1046", product: "무선 기계식 키보드 · 미드나이트 에디션", customer: "박지우", amount: 149000, status: "배송완료", date: "2026.10.27", manager: "서윤" },
  { id: "ORD-1045", product: "세라믹 머그 세트", customer: "정수빈", amount: 46000, status: "준비중", date: "2026.10.27", manager: "민재" },
  { id: "ORD-1044", product: "알루미늄 노트북 스탠드", customer: "최유진", amount: 89000, status: "취소", date: "2026.10.26", manager: "지호" },
  { id: "ORD-1043", product: "데스크 오거나이저", customer: "강시우", amount: 27500, status: "배송완료", date: "2026.10.26", manager: "민재" },
  { id: "ORD-1042", product: "월넛 모니터 받침대", customer: "윤서아", amount: 124000, status: "배송중", date: "2026.10.25", manager: "서윤" },
  { id: "ORD-1041", product: "페이퍼 위클리 플래너", customer: "한지안", amount: 18000, status: "배송완료", date: "2026.10.25", manager: "지호" },
] as const;

export type Order = (typeof orders)[number];

const won = new Intl.NumberFormat("ko-KR");
export const formatAmount = (amount: number) => `${won.format(amount)}원`;
