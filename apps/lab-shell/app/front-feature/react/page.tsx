import { REACT_VERSION_SECTIONS } from "./catalog";
import { FeatureCatalog } from "../components/FeatureCatalog";


export default function ReactFeaturesPage() {
  return (
    <FeatureCatalog
      title="React 기능 비교"
      description="useState·useEffect 같은 기본 훅으로 직접 구현한 방식과 React의 최신 기능을 적용한 방식을 비교합니다. 직접 관리하던 상태와 반복 코드를 React가 어떻게 대신하는지 살펴봅니다."
      sections={REACT_VERSION_SECTIONS}
    />
  );
}
