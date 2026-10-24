---
name: front-feature-comparison-workflow
description: UI-LAB의 React·Next.js·라이브러리 기능 비교를 실제 좌우 데모, 코드 하이라이트와 짧은 설명으로 추가하거나 수정할 때 사용합니다.
---

# 기능 비교 구현

`apps/lab-shell/AGENTS.md`를 읽고 기존 `ComparisonTemplate`과 코드 비교를 재사용합니다. 아래 `app/` 경로는 `apps/lab-shell/` 기준입니다.

## 구현 흐름
- `/front-feature/<domain>/<feature>/`에 서버 `page.tsx`, 클라이언트 비교 페이지, 좌우 데모 파일을 둡니다.
- 서버 페이지에서 실제 데모 소스를 읽어 전달하고 클라이언트에서 `topics`, `headerActions`, `leftComponent`, `rightComponent`를 연결합니다.
- 좌우는 같은 입력·조작·데이터를 사용합니다. 인공 지연·캐시·추가 최적화가 있으면 조건을 밝힙니다.
- 토픽은 최소 3개로 차이와 유지보수·성능·복잡도에 미치는 영향을 짧게 설명합니다. 실제 측정 없이 성능 수치나 순위를 만들지 않습니다.
- 코드에 `[cmp:<key>:start]` / `[cmp:<key>:end]`를 두고 `codeAnchors` 유틸로 줄을 연결합니다. 마커 파싱 실패 시 fallback을 유지합니다.
- `FeatureCatalog`의 해당 카테고리에 `since`, `status`, `href`를 등록합니다. 준비 중 항목을 실행 가능한 것으로 표시하지 않습니다.
- 공통 화면에 노출하는 비교라면 `public/previews/responsive-layout/`의 라우트·카탈로그·비교 manifest에도 연결합니다. 현재 실제 구조를 확인하고 기능 설명을 중복 저장하지 않습니다.
- 실행/코드 보기에서 의미 있는 조작만 제공하고, 같은 카테고리의 상세·목록으로 이동하게 합니다.

## 완료 확인
루트 완료 기준을 적용하고 [확인 항목](references/checklist.md)에서 화면 동작을 점검합니다.
