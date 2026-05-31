# Scenario: shopping-detail-ssr

## Goal

legacy `/shop/[slug]` 쇼핑몰 상세를 대체하는 하네스 route에서 각 프레임워크의 native SSR data loading 방식으로 동일 상품 상세 화면을 구현합니다.
비교 목적은 서버 HTML 응답 성능과 동일 기능 구현 DX입니다.

## Measurement Target

- [ ] Lighthouse performance
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

## SSR Checklist

- [x] 서버 HTML에 핵심 콘텐츠가 포함됩니다.
- [x] 서버 응답 status가 기대값입니다.
- [x] SSR, API round trip, Query cache 비용이 섞이지 않습니다.

## Notes

- Next.js, React Router, SvelteKit은 route server boundary에서 Supabase helper를 직접 호출합니다.
- Nuxt는 page에서 `useFetch`를 사용하고 Nitro `server/api`가 `server/utils` helper를 호출합니다. Nuxt의 native SSR payload/data loading 경로를 비교하기 위한 예외이며, 브라우저 API round trip 시나리오와는 분리합니다.
- 이전 `/shop/[slug]` 및 `/api/products/[slug]` 구현은 중복 비교 기준을 피하기 위해 제거되었습니다.
- 공통 SSR smoke text(필수 콘텐츠 체크)는 `Scenario: Shopping Detail SSR`입니다.
- content-ready 측정용 `SSR_EXPECT_TEXT`는 resolved 콘텐츠 전용 문자열인 `홈으로 이동`을 사용합니다. `Scenario: Shopping Detail SSR`는 Next `loading.tsx` 셸에도 있어 스트리밍 콘텐츠 도착 시각을 정확히 못 잡습니다.
- Next는 `loading.tsx`로 Suspense 스트리밍이 켜져 있어 `ttfb`(셸)와 `contentReadyMs`(콘텐츠)가 분리됩니다. 나머지 셋은 blocking이라 `ttfb ≈ contentReadyMs ≈ total`입니다. 프레임워크 간 비교는 `contentReadyMs` 기준입니다.
