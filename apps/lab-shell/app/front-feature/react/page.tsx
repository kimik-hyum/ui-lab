import { REACT_VERSION_SECTIONS } from "./catalog";
import { FeatureCatalog } from "../components/FeatureCatalog";


export default function ReactFeaturesPage() {
  return (
    <FeatureCatalog
      title="React 기능 비교"
      description="React 기능을 적용하기 전후의 동작과 코드를 같은 조건에서 비교합니다."
      sections={REACT_VERSION_SECTIONS}
    />
  );
}
