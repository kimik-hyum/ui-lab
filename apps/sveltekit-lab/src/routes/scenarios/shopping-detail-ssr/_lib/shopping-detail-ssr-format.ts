export const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(price);

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul'
  }).format(new Date(value));

export const formatStock = (stock: number) => `${stock.toLocaleString('ko-KR')}개`;

export const formatRating = (rating: number) => rating.toFixed(1);
