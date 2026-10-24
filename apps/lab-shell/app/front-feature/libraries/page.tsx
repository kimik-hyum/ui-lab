import { sections } from "./catalog";
import { FeatureCatalog } from "../components/FeatureCatalog";


export default function LibraryFeaturesPage() {
  return <FeatureCatalog title="라이브러리 비교" description="실행 화면과 코드로 라이브러리가 맡는 일을 살펴봅니다." sections={sections} />;
}
