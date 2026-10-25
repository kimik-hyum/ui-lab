# Scenario: shopping-detail-ssr

## Goal

legacy `/shop/[slug]` 쇼핑몰 상세를 대체하는 하네스 route에서 각 프레임워크의 native SSR data loading 방식으로 동일 상품 상세 화면을 구현합니다.
비교 목적은 서버 HTML 응답 성능과 동일 기능 구현 DX입니다.
네 프레임워크 모두 상품 데이터를 기다린 뒤 상품 HTML을 보내는 blocking SSR로 비교합니다.

## Measurement Target

- [x] Lighthouse performance
- [x] SSR response
- [x] DX score

## Scenario Type

- [x] SSR
- [ ] API round trip
- [ ] TanStack Query cache
- [ ] Rendering stress
- [ ] Mutation/optimistic update

## Route

`/scenarios/shopping-detail-ssr`

## Baseline Feature

React/Next 기준으로 사용할 기능:

- Next.js Server Component route
- Route-local server helper
- Route-local presentational view
- React Router loader
- SvelteKit `+page.server.ts`
- Nuxt `useFetch`/Nitro SSR data loading

## Required States

- Initial SSR success: `wireless-headphones-x1` 상품 상세를 서버 HTML에 렌더링합니다.
- Override success: `?slug=` search param으로 같은 데이터 contract의 다른 상품을 렌더링할 수 있습니다.
- Empty/Not found: 상품이 없으면 404 또는 프레임워크 관용구의 error boundary로 처리합니다.
- Error: Supabase 조회 실패는 route-level error로 노출합니다.

## Required Interactions

- 홈으로 이동하는 링크를 제공합니다.
- 이 시나리오는 SSR 응답 비교가 목적이므로 client interaction은 추가하지 않습니다.

## Data Source

- Fixture: N/A
- Server API: Supabase `products` table
- External service: Supabase local/project endpoint
- Deterministic seed: `wireless-headphones-x1`

## Allowed Optimizations

- Framework-native SSR data loading
- Route-level colocation
- Server-only helper 분리
- Presentational view 분리
- Nuxt의 SSR `useFetch` + Nitro handler 흐름

## Not Allowed

- legacy `/shop/[slug]` 또는 `/api/products/[slug]` route를 새 비교 기준으로 재사용하기
- 브라우저 client fetch로 초기 상세 데이터를 가져오기
- TanStack Query cache 비용을 이 SSR-only 시나리오에 섞기
- Next/React Router/SvelteKit에서 앱 내부 API endpoint를 다시 fetch하기
- 특정 프레임워크에만 유리한 사전 계산
- 서버 HTML 핵심 콘텐츠 생략
- 상품 조회를 `loading.tsx`/`Suspense`, 미해결 load Promise, Nuxt SSR streaming으로 먼저 전송되는 셸과 분리하기

## SSR Checklist

- [x] 서버 HTML에 핵심 콘텐츠가 포함됩니다.
- [x] 서버 응답 status가 기대값입니다.
- [x] SSR, API round trip, Query cache 비용이 섞이지 않습니다.

## Notes

- Next.js, React Router, SvelteKit은 route server boundary에서 Supabase helper를 직접 호출합니다.
- Nuxt는 page에서 `useFetch`를 사용하고 Nitro `server/api`가 `server/utils` helper를 호출합니다. Nuxt의 native SSR payload/data loading 경로를 비교하기 위한 예외이며, 브라우저 API round trip 시나리오와는 분리합니다.
- 이전 `/shop/[slug]` 및 `/api/products/[slug]` 구현은 중복 비교 기준을 피하기 위해 제거되었습니다.
- 공통 SSR smoke text(필수 콘텐츠 체크)는 `Scenario: Shopping Detail SSR`입니다.
- content-ready 측정용 `SSR_EXPECT_TEXT`는 실제 조회 결과인 `Wireless Headphones X1`을 사용합니다. 제목이나 오류 화면의 링크만으로 정상 상품 도착을 판정하지 않습니다.
- Next의 route-local `loading.tsx`를 제거했고, 상위 layout에도 상품 조회를 감싸는 Suspense 경계가 없습니다. React Router/SvelteKit의 server loader는 상품을 `await`하고, Nuxt의 SSR streaming은 활성화하지 않습니다.
- blocking은 상품 조회가 끝나기 전에 로딩 셸을 보내지 않는다는 의미입니다. HTML·RSC payload의 전송은 여러 네트워크 청크로 나뉠 수 있으므로 청크 개수나 TTFB와 total의 일치 여부만으로 판정하지 않습니다.
- 변경 전 성능 기록은 당시의 방식(Next 스트리밍, 나머지 blocking)을 유지합니다. blocking 통일 후 측정은 별도 `PERF_COMPARISON_ID`와 각 대상의 `renderingMode`로 기록하며, 과거 기록을 새 구현의 성능값으로 재해석하지 않습니다.
