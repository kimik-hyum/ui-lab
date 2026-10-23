import { FeatureCatalog } from "../front-feature/components/FeatureCatalog";
import { LAB_SECTIONS } from "./catalog";

export default function VoidUIPage() {
  return <FeatureCatalog title="실험실" description="직접 구상한 아이디어를 UI로 구현하고, 사용하면서 다듬는 공간입니다." sections={LAB_SECTIONS} purpose="experiment" />;
}
