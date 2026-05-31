# AGENTS.md

이 파일은 `apps/react-router-lab/`에서 작업하는 서브에이전트를 위한 React Router v7 Framework Mode 아키텍처 기준입니다.
상위 `apps/AGENTS.md`의 공통 하네스 구현 규칙을 먼저 따르고, 이 파일은 React Router 전용 route module, loader, action 기준을 보완합니다.

## 목표

- React Router v7 Framework Mode의 route module, loader, action, pending UI 관용구를 사용합니다.
- Next.js App Router와 비교 가능한 책임 구조를 유지하되, React Router답게 `routes.ts`와 route module을 중심으로 둡니다.
- 퍼포먼스 비교용 시나리오가 과한 앱 구조 없이 route, data, mutation, UI, query 책임을 분명히 드러내게 합니다.

## 기본 구조

현재 앱은 `app/routes.ts`에서 route config를 관리합니다.
새 시나리오는 가능한 아래 구조를 따릅니다.

```txt
app/routes.ts
app/routes/scenarios.{scenario-id}.tsx
app/routes/api.{scenario-id}.tsx

app/scenarios/{scenario-id}/
  components/
    {ScenarioName}View.tsx
  lib/
    {scenario-id}-data.server.ts
    {scenario-id}-types.ts
    {scenario-id}-query.ts
    {scenario-id}-mutation.ts
```

- `app/routes/scenarios.{scenario-id}.tsx`는 route module입니다. `loader`, `action`, `meta`, `ErrorBoundary`, default component 같은 route convention export만 둡니다.
- 실제 UI는 `app/scenarios/{scenario-id}/components/`에 둡니다.
- 서버 전용 데이터 접근은 `.server.ts` 파일에 둡니다. 이 파일은 client component나 shared query hook에서 import하지 않습니다.
- query key, query option, browser-safe fetcher는 `{scenario-id}-query.ts`에 둡니다.
- resource route/API가 필요한 경우 `app/routes/api.{scenario-id}.tsx`를 추가하고 `routes.ts`에 연결합니다.

## 현재 구조와 신규 구조

- 현재 앱은 `app/routes.ts`와 `app/routes/*.tsx` route module 구조를 사용합니다.
- 새 하네스 시나리오는 `/scenarios/{scenario-id}` route를 `app/routes.ts`에 등록하고, 실제 구현은 `app/scenarios/{scenario-id}`에 모읍니다.
- legacy `/shop/:slug` 상세는 제거되었습니다. 새 쇼핑몰 상세 비교는 `/scenarios/shopping-detail-ssr` 구조를 기준으로 잡습니다.

## Route Entry와 View 기준

- route module은 얇게 유지합니다.
- `loader`는 초기 서버 데이터 로딩과 route-level precondition을 담당합니다.
- `action`은 route-level mutation과 redirect/revalidation 경계를 담당합니다.
- default component는 `loaderData`, `actionData`, `params`를 view에 전달하고 화면을 조합합니다.
- `ErrorBoundary`는 시나리오 단위 실패 화면을 담당합니다.
- route module 안에 큰 UI, 복잡한 business logic, 대량 fixture 생성 로직을 직접 넣지 않습니다.

## 데이터 로딩 기준

- 초기 렌더링에 필요한 데이터는 `loader`에서 로딩합니다.
- SSR 환경에서 `loader`는 초기 page load와 client navigation 모두의 데이터 경계입니다.
- 서버 전용 API, 환경 변수, DB/Supabase 접근은 `.server.ts` 모듈에 둡니다.
- client-only 데이터가 목적일 때만 `clientLoader`를 검토합니다.
- URL search params가 상태의 source of truth라면 React state로 복제하지 말고 `loader`와 `useSearchParams` 흐름을 우선합니다.

## SSR/API/Query 시나리오 구분

- SSR 자체 성능을 비교하는 시나리오는 resource route/API를 거치지 않고 `loader`에서 server helper를 직접 호출합니다.
- API endpoint 왕복 비용까지 비교하는 시나리오는 `app/routes/api.{scenario-id}.tsx`를 명시적으로 만들고, 시나리오 이름이나 코드 주석에 API round trip이 의도임을 남깁니다.
- TanStack Query hydration/client cache를 비교하는 시나리오는 순수 loader SSR 시나리오와 분리하고, loader, initial data, query key, hydration 경계를 코드에서 드러냅니다.
- 기본은 `loader`를 `await`하는 blocking SSR이라 `ttfb ≈ content-ready ≈ total`입니다. streaming 비교가 목적이면 `loader`가 Promise를 반환하고 `<Await>`/`Suspense`로 처리하며, 이 경우 `ttfb`(셸)와 content-ready를 분리해 비교합니다.
- 예: `shopping-detail-ssr`, `shopping-detail-api`, `shopping-detail-query`처럼 목적별로 나누면 server render 비용, API 왕복 비용, client cache 비용이 섞이지 않습니다.

## TanStack Query 기준

- 앱 루트에는 `QueryProvider`가 준비되어 있습니다.
- TanStack Query는 클라이언트 캐시, background refetch, pagination, infinite query, optimistic mutation에 사용합니다.
- React Router는 data loading/mutation/navigation의 타이밍을 맡고, TanStack Query는 캐싱/무효화/저장 책임을 맡는 방식으로 결합합니다.
- query-managed 시나리오에서는 route `loader`가 필요한 초기 데이터를 준비하고, view는 동일 query key를 통해 캐시된 데이터를 읽는 구조를 우선 검토합니다.
- 현재 기본 세팅은 client `QueryProvider` 중심입니다. 서버 prefetch/dehydrate까지 필요한 시나리오는 loader 반환값, initial data, hydration 방식을 해당 시나리오에서 명시적으로 설계합니다.
- 순수 loader 성능이나 SSR 렌더링 비교가 목적이면 TanStack Query를 억지로 넣지 않습니다.

## Mutation 기준

- 기본 form mutation은 route `action`을 우선 검토합니다.
- 페이지 이동을 동반하는 form은 `<Form>`과 `useNavigation`을 사용합니다.
- 페이지 이동 없이 독립 pending/optimistic 상태가 필요한 mutation은 `useFetcher` 또는 TanStack Query mutation을 검토합니다.
- `action` 완료 후 loader revalidation, query invalidation, optimistic rollback 중 어떤 동기화 방식을 쓰는지 코드 구조에서 드러나게 합니다.

## 상태와 Pending UI 기준

- navigation pending은 `useNavigation`을 우선 사용합니다.
- 독립 form/fetch pending은 `useFetcher`를 우선 사용합니다.
- 네트워크 상태, loader data, action data를 React state로 중복 저장하지 않습니다.
- ephemeral UI state만 view에서 관리합니다.
- URL에 남아야 하는 상태는 search params를 우선 사용합니다.

## Import와 서버 경계 기준

- Framework Mode에서는 `react-router-dom` 대신 `react-router` import를 우선합니다.
- route config helper는 `@react-router/dev/routes`에서 가져옵니다.
- 서버 전용 모듈은 `.server.ts` suffix를 사용해 client bundle 유입을 피합니다.
- 특정 시나리오에만 필요한 무거운 라이브러리는 route-local view 또는 scenario lib에서 import합니다.

## 성능 비교 유의사항

- `app/root.tsx`는 전역 provider와 문서 shell만 유지합니다.
- 비교 목적이 렌더링 성능이면 loader/API 비용과 구분되도록 deterministic fixture를 사용합니다.
- 비교 목적이 data loading이면 loader, resource route, TanStack Query cache 경계를 코드 이름으로 드러냅니다.
- loader/action/revalidation 흐름이 결과에 영향을 주면 코드나 문서에 짧게 남깁니다.

## 시나리오 추가 체크리스트

- `app/routes.ts`에 `/scenarios/{scenario-id}` route를 등록합니다.
- route module, view, server data, query, mutation 책임이 분리되어 있습니다.
- view 파일은 하나의 UI surface만 export합니다.
- SSR, API round trip, TanStack Query cache 중 무엇을 측정하는지 시나리오 이름이나 코드 구조에서 드러납니다.
- `react-router typegen`, `yarn lint`, `yarn build`를 통과해야 합니다.
