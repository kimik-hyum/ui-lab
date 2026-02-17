# AGENTS.md

이 프로젝트에서 작업할 때는 아래 규칙을 따르세요.

## 응답 언어
- 모든 응답은 한국어로 작성합니다.

## 라이브러리/프레임워크 규칙
- Next.js (App Router)
  - 기본은 서버 컴포넌트로 작성하고, 브라우저 전용 로직이 필요한 경우에만 `'use client'`를 사용합니다.
  - 라우팅은 `next/link`를 사용하고, 이미지가 필요하면 `next/image`를 우선합니다.
- React
  - 훅 규칙을 준수하고(`useEffect`, `useMemo` 등), 불필요한 상태 복제는 피합니다.
  - 상태는 가능한 단일 소스(Source of Truth)로 유지합니다.
- TypeScript
  - `any` 사용을 지양하고, 필요한 경우 최소 범위로 제한합니다.
  - 컴포넌트 props와 주요 데이터 구조는 명확한 타입을 정의합니다.
- Tailwind CSS
  - 스타일은 `className` 중심으로 작성하고, 인라인 스타일은 꼭 필요한 경우에만 사용합니다.
  - 반복되는 스타일은 공통 컴포넌트/유틸로 정리합니다.
- ESLint
  - 규칙 비활성화는 마지막 수단이며, 필요 시 주석으로 이유를 간단히 남깁니다.
- react-syntax-highlighter
  - 필요한 스타일만 import 해서 번들 크기를 최소화합니다.

## 기능 비교(Feature Comparison) 작업 규칙
- 새로운 React/Next 기능 비교를 추가할 때는 `ComparisonTemplate` 기반으로 구현합니다.
- 비교 페이지는 아래 구조를 기본으로 사용합니다.
  - 서버 페이지에서 좌/우 데모 코드 문자열을 읽어 전달
  - 클라이언트 비교 페이지에서 `topics`, `headerActions`, `leftComponent`, `rightComponent`를 조합
  - 좌/우 데모 컴포넌트는 분리 파일로 관리
- 코드 하이라이트 라인은 숫자 하드코딩보다 앵커 기반 매핑을 우선 사용합니다.
  - 코드 내 마커: `[cmp:<key>:start]` / `[cmp:<key>:end]`
  - 앵커 파싱 실패 시 fallback 라인을 유지해 UI 깨짐을 방지합니다.
- 설명 토픽은 최소 3개 이상 작성하고, 각 토픽은 “차이점 + 실질적 영향(유지보수/성능/복잡도)”을 포함합니다.
- 카탈로그(`FeatureCatalog`) 항목은 `since`, `status(available|planned)`, `href`를 함께 관리합니다.

## 완료 기준
- `yarn lint` 통과
- `yarn build` 통과
- 코드 비교 화면에서 hover 토픽/라인 매칭이 자연스럽게 동작
