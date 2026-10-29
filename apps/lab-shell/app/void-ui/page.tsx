import { FeatureCatalog } from "../front-feature/components/FeatureCatalog";
import { LAB_SECTIONS } from "./catalog";

export default function VoidUIPage() {
  return <FeatureCatalog title="실험실" description="작은 호기심이 만든 것들. 지도 편집기 Termia부터 작은 인터랙션까지, 직접 기획하고 만든 서비스와 UI 실험을 소개합니다." sections={LAB_SECTIONS} purpose="experiment" />;
}
