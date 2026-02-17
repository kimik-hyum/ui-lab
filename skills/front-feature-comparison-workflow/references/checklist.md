# Front Feature Comparison Checklist

## 1) Catalog
- FeatureCatalog 카드 추가 (`available/planned`, `since`, `href`)
- 카드 텍스트가 기능 목적과 정확히 일치하는지 확인

## 2) Route
- `/front-feature/<domain>/<feature>` 페이지 생성
- 서버 페이지에서 좌/우 코드 파일 문자열 로딩

## 3) Comparison Template
- `ComparisonTemplate` 사용
- `leftComponent`/`rightComponent` 분리
- `headerActions`에 재현 가능한 조작 버튼 제공 (랜덤 의존 최소화)

## 4) Anchor Mapping
- 데모 코드에 `[cmp:key:start/end]` 마커 삽입
- topic 정의에서 `leftAnchors/rightAnchors` 사용
- 파싱 실패 fallback 라인 존재

## 5) Explanation
- 최소 3개 토픽
- 각 토픽은 차이 + 영향(가독성, 유지보수, 백그라운드 비용 등) 설명

## 6) Validation
- lint/build 통과
- 코드뷰 hover 시 토픽 표시 정상
- 반대편 스크롤이 과도하게 튀지 않는지 수동 확인
