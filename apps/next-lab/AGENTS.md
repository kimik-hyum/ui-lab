# AGENTS.md

이 파일은 `apps/next-lab/`에서 작업하는 서브에이전트를 위한 Next.js App Router 아키텍처 기준입니다.
상위 `apps/AGENTS.md`의 공통 하네스 구현 규칙을 먼저 따르고, 이 파일은 Next.js 전용 배치와 판단 기준을 보완합니다.

## 목표

- 퍼포먼스 비교용 시나리오를 작고 반복 가능한 단위로 구현합니다.
- 실무에서 어색하지 않은 App Router 관용구를 사용하되, 하네스 비교를 방해하는 과한 추상화는 피합니다.
- 동일 기능을 다른 프레임워크와 비교할 수 있도록 route, data, mutation, UI, query 책임을 코드 구조에서 분명히 드러냅니다.

## 기본 구조

새 시나리오는 가능한 아래 구조를 따릅니다.

```txt
app/scenarios/{scenario-id}/
  page.tsx
  loading.tsx
  error.tsx
  _components/
    {ScenarioName}View.tsx
  _lib/
    {scenario-id}-data.ts
    {scenario-id}-types.ts
    {scenario-id}-query.ts
  _actions/
    {scenario-id}-actions.ts

app/api/{scenario-id}/
  route.ts
```

- `page.tsx`는 route entry입니다. 초기 서버 데이터 로딩, search params/params 해석, view 조합만 담당합니다.
- `_components/`는 route-local UI를 둡니다. 브라우저 이벤트, hook, TanStack Query hook이 필요한 파일에만 `"use client"`를 붙입니다.
- `_lib/`는 데이터 fetcher, query option, 타입, deterministic fixture, 순수 계산을 둡니다.
- `_actions/`는 Server Action 비교가 필요한 시나리오에서만 둡니다.
- `app/api/{scenario-id}/route.ts`는 브라우저 API 호출, TanStack Query queryFn, 외부 contract 비교가 필요한 경우에만 둡니다.

## 현재 구조와 신규 구조

- 현재 앱은 `app/scenarios/data-loading`과 `app/scenarios/shopping-detail-ssr`를 함께 사용합니다.
- 새 하네스 시나리오는 `/scenarios/{scenario-id}` URL과 `app/scenarios/{scenario-id}` 폴더를 기본으로 사용합니다.
- legacy `/shop/[slug]` 상세는 제거되었습니다. 새 쇼핑몰 상세 비교는 `/scenarios/shopping-detail-ssr` 구조를 기준으로 잡습니다.

## Route Entry와 View 기준

- 기본은 Server Component입니다.
- 큰 layout, page, 정적 shell을 Client Component로 만들지 않습니다.
- `"use client"`는 사용자 이벤트, 브라우저 API, React state/effect, TanStack Query hook이 필요한 leaf 컴포넌트에만 붙입니다.
- `page.tsx`는 view 구현을 길게 품지 않고 route-local view component로 조합합니다.
- Server Component에서 가져온 데이터는 직렬화 가능한 props로 Client Component에 전달합니다.

## 데이터 로딩 기준

- 초기 렌더링에 반드시 필요한 데이터는 `page.tsx` 또는 route-local server helper에서 직접 로딩합니다.
- Server Component에서 자기 앱의 `app/api/**/route.ts`를 다시 `fetch`하지 않습니다. 같은 앱 안의 서버 데이터는 함수 호출로 직접 가져옵니다.
- route handler는 브라우저에서 호출해야 하는 API, TanStack Query queryFn, 외부 contract 비교가 필요한 경우에 사용합니다.
- 데이터 생성/정렬/필터링 같은 성능 비교 핵심 로직은 view 파일에 숨기지 말고 `_lib/`에 둡니다.

## SSR/API/Query 시나리오 구분

- SSR 자체 성능을 비교하는 시나리오는 route handler를 거치지 않고 server helper를 직접 호출합니다.
- API endpoint 왕복 비용까지 비교하는 시나리오는 `app/api/{scenario-id}/route.ts`를 명시적으로 만들고, 시나리오 이름이나 코드 주석에 API round trip이 의도임을 남깁니다.
- TanStack Query hydration/client cache를 비교하는 시나리오는 SSR 시나리오와 분리하고, prefetch, dehydrate, `HydrationBoundary` 경계를 코드에서 드러냅니다.
- `loading.tsx`나 `<Suspense>`를 두면 App Router가 셸을 먼저 streaming하므로 `ttfb`가 낮아집니다. 이는 콘텐츠 도착 시간이 아니라 셸 도착 시간이므로, SSR 응답 비교는 content-ready 기준으로 보고 streaming 사용 여부를 코드/문서에 남깁니다. blocking ttfb를 다른 프레임워크와 동일 축으로 비교하려면 streaming을 빼고 데이터를 `await`합니다.
- 예: `shopping-detail-ssr`, `shopping-detail-api`, `shopping-detail-query`처럼 목적별로 나누면 server render 비용, API 왕복 비용, client cache 비용이 섞이지 않습니다.

## TanStack Query 기준

- 앱 루트에는 `QueryProvider`가 준비되어 있습니다.
- TanStack Query는 클라이언트 remote state, background refetch, pagination, infinite query, optimistic mutation에 사용합니다.
- query-managed 시나리오는 `_lib/{scenario-id}-query.ts`에 query key와 query option/fetcher를 모읍니다.
- 서버 prefetch/hydration이 필요한 경우 `QueryClient`, `dehydrate`, `HydrationBoundary`를 시나리오 route에서 명시적으로 구성합니다.
- 순수 Server Component 렌더링 비교나 결정적 fixture 렌더링 테스트에는 TanStack Query를 억지로 넣지 않습니다.

## Mutation 기준

- form 제출 자체와 Server Action DX를 비교할 때는 Server Action을 우선 검토합니다.
- 클라이언트 캐시, optimistic update, background invalidation을 비교할 때는 route handler + TanStack Query mutation을 우선 검토합니다.
- mutation 이후 화면 동기화 방식은 시나리오 목적에 맞게 `revalidatePath`, query invalidation, optimistic rollback 중 하나를 명확히 선택합니다.

## 상태와 Pending UI 기준

- view가 직접 가져도 되는 상태는 modal, tab, input draft, hover/focus, 선택 표시처럼 순수 UI 상태로 제한합니다.
- 서버 데이터 원본, API 응답, cache 상태를 React state로 중복 저장하지 않습니다.
- route-level pending은 `loading.tsx`, Suspense, transition을 시나리오 목적에 맞게 사용합니다.
- form/action pending은 Server Action 상태 또는 TanStack Query mutation 상태 중 하나를 명확히 선택합니다.

## Import와 서버 경계 기준

- Client Component에 server-only 모듈을 import하지 않습니다.
- 서버 전용 helper는 route-local `_lib` 또는 앱 공용 `lib`에 두되, client component에서 import되지 않도록 파일명과 import 경로를 명확히 관리합니다.
- 라우팅은 `next/link`를 사용하고, 이미지 최적화가 비교 목적을 흐리지 않는 경우 `next/image`를 우선 검토합니다.
- 특정 시나리오에만 필요한 무거운 라이브러리는 route-local Client Component에서 import합니다.

## 성능 비교 유의사항

- 전역 provider, 전역 CSS, 공유 dependency를 추가하기 전에 모든 프레임워크 비교에 필요한지 확인합니다.
- 비교 목적이 렌더링 성능이면 데이터 fetch 비용과 구분되도록 deterministic fixture를 사용합니다.
- 비교 목적이 data loading이면 API round trip, cache hit/miss, server render 경계를 문서나 코드 이름으로 드러냅니다.
- Next.js의 RSC/Client Component 경계가 결과에 영향을 주면 코드나 문서에 짧게 남깁니다.

## 시나리오 추가 체크리스트

- URL은 `/scenarios/{scenario-id}` 형태로 둡니다.
- route entry, view, data, query, mutation 책임이 분리되어 있습니다.
- view 파일은 하나의 UI surface만 export합니다.
- SSR, API round trip, TanStack Query cache 중 무엇을 측정하는지 시나리오 이름이나 코드 구조에서 드러납니다.
- `yarn lint`와 `yarn build`를 통과해야 합니다.
