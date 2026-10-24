import { NEXTJS_VERSION_SECTIONS } from "./catalog";
import { FeatureCatalog } from "../components/FeatureCatalog";


export default function NextJSFeaturesPage() {
  return (
    <FeatureCatalog
      title="Next.js 기능 비교"
      description="서버와 클라이언트의 역할, 데이터 요청과 렌더링 방식을 코드와 실행 결과로 비교합니다."
      sections={NEXTJS_VERSION_SECTIONS}
    />
  );
}
