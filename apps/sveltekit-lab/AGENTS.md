# AGENTS.md

이 파일은 `apps/sveltekit-lab/`에서 작업하는 서브에이전트를 위한 SvelteKit 아키텍처 기준입니다.
상위 `apps/AGENTS.md`의 공통 하네스 구현 규칙을 먼저 따르고, 이 파일은 SvelteKit 전용 routes, load, form actions, server-only module 기준을 보완합니다.

## 목표

- SvelteKit의 파일 기반 라우팅과 `+page`, `+page.server`, `+server` convention을 유지합니다.
- 퍼포먼스 비교용 시나리오를 작고 반복 가능한 단위로 구현합니다.
- route-local colocation을 활용하되, 서버 전용 코드는 `$lib/server` 또는 `.server.ts`로 안전하게 분리합니다.

## 기본 구조

새 시나리오는 가능한 아래 구조를 따릅니다.

```txt
src/routes/scenarios/{scenario-id}/
  +page.server.ts
  +page.svelte
  +error.svelte
  _components/
    {ScenarioName}View.svelte
  _lib/
    {scenario-id}-types.ts
    {scenario-id}-transforms.ts
    {scenario-id}-query.ts

src/routes/api/scenarios/{scenario-id}/
  +server.ts

src/lib/server/scenarios/
  {scenario-id}.ts

src/lib/scenarios/{scenario-id}/
  fixtures.ts
  types.ts
```

- `+page.server.ts`는 SSR/server-only data boundary입니다. DB, private env, Supabase 접근은 여기서 server helper를 호출해 처리합니다.
- `+page.svelte`는 route entry view입니다. `data`를 받아 view를 조합하고, 복잡한 UI는 `_components/`로 분리합니다.
- `_components/`는 해당 route에서만 쓰는 UI를 둡니다.
- `_lib/`는 route-local 타입, query key, browser-safe fetcher, 순수 transform을 둡니다.
- `src/routes/api/scenarios/{scenario-id}/+server.ts`는 API endpoint가 필요한 시나리오에서만 둡니다.
- `src/lib/server/scenarios/`는 서버 전용 데이터 접근을 둡니다.
- `src/lib/scenarios/{scenario-id}/`는 app/server 양쪽에서 쓰는 fixture와 타입을 둡니다.

## 현재 구조와 신규 구조

- 현재 앱은 `src/routes/scenarios/data-loading`과 `src/routes/scenarios/shopping-detail-ssr`를 함께 사용합니다.
- 새 하네스 시나리오는 `/scenarios/{scenario-id}` URL과 `src/routes/scenarios/{scenario-id}` 폴더를 기본으로 사용합니다.
- legacy `/shop/[slug]` 상세는 제거되었습니다. 새 쇼핑몰 상세 비교는 `/scenarios/shopping-detail-ssr` 구조를 기준으로 잡습니다.

## Route Entry와 View 기준

- route 폴더는 SvelteKit의 `+` 파일 convention을 따릅니다.
- `+page.server.ts`는 데이터와 precondition을 담당하고, `+page.svelte`는 받은 데이터를 표현합니다.
- page 파일은 얇게 유지합니다.
- 복잡한 template, table, list, form, 가상화 UI는 `_components/`로 분리합니다.
- view component는 하나의 UI surface만 export하며, 서버 데이터 원본을 별도 local state로 복제하지 않습니다.
- SvelteKit에서는 일반 `<a>` navigation을 사용합니다.

## 데이터 로딩 기준

- private env, DB, Supabase 접근이 필요한 초기 데이터는 `+page.server.ts`에서 로딩합니다.
- 외부 공개 API처럼 클라이언트에서도 안전한 fetch는 필요에 따라 universal `+page.ts`를 검토할 수 있습니다.
- `+page.server.ts`에서 내부 `+server.ts` endpoint를 `fetch`할 수 있지만, 순수 SSR 성능 비교에서는 `$lib/server/scenarios/{scenario-id}.ts` helper 직접 호출을 우선합니다.
- API response 변환, fixture 생성, 정렬/필터링 같은 성능 비교 핵심 로직은 view 파일에 숨기지 않고 `_lib/` 또는 `$lib/scenarios/`로 분리합니다.

## SSR/API/Query 시나리오 구분

- SSR 자체 성능을 비교하는 시나리오는 `+page.server.ts`에서 `$lib/server` helper를 직접 호출합니다.
- API endpoint 왕복 또는 SvelteKit server `fetch` inline 동작까지 비교하는 시나리오는 `src/routes/api/scenarios/{scenario-id}/+server.ts`를 명시적으로 만들고, 시나리오 이름이나 코드 주석에 API/fetch 경계가 의도임을 남깁니다.
- TanStack Query hydration/client cache를 비교하는 시나리오는 순수 SvelteKit SSR 시나리오와 분리하고, query key, queryFn, initial data 또는 hydration 경계를 코드에서 드러냅니다.
- 기본은 `load`에서 데이터를 `await`하는 blocking SSR이라 `ttfb ≈ content-ready ≈ total`입니다. streaming 비교가 목적이면 `load`가 streamed promise를 반환하고 `{#await}`로 처리하며, 이 경우 `ttfb`(셸)와 content-ready를 분리해 비교합니다.
- 예: `shopping-detail-ssr`, `shopping-detail-api`, `shopping-detail-query`처럼 목적별로 나누면 SSR load 비용, API/fetch 경계 비용, client cache 비용이 섞이지 않습니다.

## TanStack Query 기준

- 앱 루트에는 `QueryClientProvider`가 준비되어 있습니다.
- TanStack Query는 client cache, background refetch, pagination, infinite query, optimistic mutation에 사용합니다.
- SvelteKit native `load`만으로 충분한 SSR-only 시나리오에는 TanStack Query를 억지로 넣지 않습니다.
- query-managed 시나리오는 route-local `_lib/{scenario-id}-query.ts`에 query key와 queryFn을 모읍니다.
- queryFn은 browser-safe fetcher만 import합니다. `$lib/server` 모듈을 query module이나 `.svelte` 파일에서 직접 import하지 않습니다.
- 서버 prefetch/hydration이 필요한 경우 해당 시나리오에서 SvelteKit load data와 TanStack Query cache가 각각 무엇을 담당하는지 명확히 남깁니다.

## Mutation 기준

- SvelteKit native form action DX를 비교할 때는 `+page.server.ts`의 `actions`를 우선 검토합니다.
- API endpoint 기반 mutation이 필요한 경우 `+server.ts`의 `POST`/`PATCH`/`DELETE` handler를 둡니다.
- optimistic update, cache invalidation, background refetch가 핵심인 시나리오는 TanStack Query mutation을 검토합니다.
- mutation 이후 동기화 방식은 SvelteKit invalidation, form action response, query invalidation, optimistic rollback 중 하나를 명확히 선택합니다.

## 상태와 Pending UI 기준

- view가 직접 가져도 되는 상태는 modal, tab, input draft, hover/focus, 선택 표시처럼 순수 UI 상태로 제한합니다.
- 서버 데이터 원본, API 응답, cache 상태를 local state/rune로 중복 저장하지 않습니다.
- native form pending은 SvelteKit form/action 흐름을 우선 사용하고, client cache pending은 TanStack Query 상태를 사용합니다.
- `load` 재실행과 component local state 보존이 성능/UX에 영향을 주면 코드나 문서에 짧게 남깁니다.

## Import와 서버 경계 기준

- 서버 전용 코드는 `$lib/server` 또는 `.server.ts` suffix를 사용합니다.
- `.svelte`, `+page.ts`, browser-safe query module에서는 `$lib/server`를 import하지 않습니다.
- `import type`만 필요한 경우 값 import로 바꾸지 않습니다.
- app/server 공용 코드는 `$lib/scenarios/{scenario-id}`에 둡니다.
- 무거운 client-only 라이브러리는 route-local component나 browser-only query module에서만 import합니다.

## 성능 비교 유의사항

- 전역 provider, 전역 CSS, 공유 dependency를 추가하기 전에 모든 프레임워크 비교에 필요한지 확인합니다.
- 비교 목적이 렌더링 성능이면 API 호출 비용과 구분되도록 `$lib/scenarios/{scenario-id}/fixtures.ts` 같은 deterministic fixture를 사용합니다.
- 비교 목적이 data loading이면 `+page.server.ts`, universal `+page.ts`, `+server.ts`, TanStack Query cache 중 무엇을 측정하는지 코드 이름으로 드러냅니다.
- SvelteKit의 fetch inlining, request coalescing, invalidation 흐름이 결과에 영향을 주면 코드나 문서에 짧게 남깁니다.
- 성능 테스트는 dev mode가 아니라 build 후 preview/production 모드에서 비교합니다.

## 시나리오 추가 체크리스트

- URL은 `/scenarios/{scenario-id}` 형태로 둡니다.
- page, view, load, server API, server utility, shared fixture/type 책임이 분리되어 있습니다.
- view 파일은 하나의 UI surface만 export합니다.
- SvelteKit native SSR, API/fetch boundary, TanStack Query cache 중 무엇을 측정하는지 시나리오 이름이나 코드 구조에서 드러납니다.
- `yarn lint`와 `yarn build`를 통과해야 합니다.
