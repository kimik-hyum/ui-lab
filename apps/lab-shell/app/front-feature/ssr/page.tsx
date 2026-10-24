import { FeatureCatalog } from "../components/FeatureCatalog";
import { SSR_SECTIONS } from "./catalog";

export default function SsrComparisonsPage() {
  return <FeatureCatalog title="SSR 구현 비교" description="서버 데이터를 불러오고 HTML을 만드는 방식을 실행 결과와 코드로 비교합니다." sections={SSR_SECTIONS} />;
}
