# AGENTS.md

이 파일은 `apps/vue-lab/`에서 작업하는 서브에이전트를 위한 Nuxt 아키텍처 기준입니다.
상위 `apps/AGENTS.md`의 공통 하네스 구현 규칙을 먼저 따르고, 이 파일은 Nuxt 전용 pages, components, composables, server, shared 기준을 보완합니다.

## 목표

- Nuxt의 파일 기반 라우팅과 역할 디렉터리 convention을 유지합니다.
- 퍼포먼스 비교용 시나리오를 작고 반복 가능한 단위로 구현합니다.
- Next.js처럼 route 폴더 하나에 모든 파일을 모으지 않고, Nuxt답게 app/server/shared 레이어를 나누되 `scenario-id`로 추적 가능하게 묶습니다.

## 기본 구조

Nuxt 4 기준으로 새 시나리오는 가능한 아래 구조를 따릅니다.

```txt
app/
  pages/
    scenarios/
      {scenario-id}.vue
  components/
    scenarios/
      {scenario-id}/
        {ScenarioName}View.vue
  composables/
    scenarios/
      {scenario-id}/
        use{ScenarioName}Query.ts
        use{ScenarioName}State.ts
  plugins/
    vue-query.ts

server/
  api/
    scenarios/
      {scenario-id}.get.ts
      {scenario-id}.post.ts
  utils/
    scenarios/
      {scenario-id}.ts

shared/
  scenarios/
    {scenario-id}/
      types.ts
      fixtures.ts
      transforms.ts
```

- `app/pages/scenarios/{scenario-id}.vue`는 route entry입니다. route params/search params 해석, Nuxt data fetching, view 조합만 담당합니다.
- `app/components/scenarios/{scenario-id}/`는 route-local UI를 둡니다.
- `app/composables/scenarios/{scenario-id}/`는 browser-safe query/composable과 UI orchestration을 둡니다.
- `server/api/scenarios/`는 Nitro API endpoint가 필요한 시나리오에서만 둡니다.
- `server/utils/scenarios/`는 서버 전용 데이터 접근, Supabase/DB 호출, API handler가 공유할 server helper를 둡니다.
- `shared/scenarios/{scenario-id}/`는 app/server 양쪽에서 사용할 수 있는 타입, deterministic fixture, 순수 변환 로직을 둡니다.

## 현재 구조와 신규 구조

- 현재 앱은 별도 `srcDir` 없이 루트의 `pages/`, `components/`, `composables/`, `server/`, `shared/`, `plugins/`, `assets/`를 사용합니다.
- 위 "기본 구조"의 `app/` 접두사는 Nuxt 4에서 `app/` srcDir을 쓸 때의 경로입니다. 이 랩처럼 루트 srcDir을 쓰는 경우 `app/`를 떼고 같은 역할 디렉터리(`pages/`, `components/`, `composables/`)에 둡니다. 둘 중 하나로 **앱 전체가 일관되게** 유지되는 것이 핵심입니다.
- 새 하네스 시나리오도 현재 앱과 같은 루트 srcDir 구조를 따릅니다. srcDir 전환은 라우트 URL, 빌드 결과, import alias가 바뀌므로 별도 작업으로 분리합니다.
- legacy `/shop/[slug]` 상세는 제거되었습니다. 새 쇼핑몰 상세 비교는 `/scenarios/shopping-detail-ssr` 구조를 기준으로 잡습니다.

## Route Entry와 View 기준

- page 파일은 얇게 유지합니다.
- 복잡한 template, table, list, form, 가상화 UI는 `components/scenarios/{scenario-id}/`로 분리합니다.
- page 파일에서 허용되는 책임은 route-level data fetching, error 처리, head/meta, view 조합입니다.
- view component는 하나의 UI surface만 export하며, 서버 데이터 원본을 별도 local state로 복제하지 않습니다.
- 순수 format/transform 함수는 page나 view 안에 숨기지 말고 `shared/` 또는 scenario util로 분리합니다.

## 데이터 로딩 기준

- Nuxt native SSR 시나리오는 `useFetch` 또는 `useAsyncData`를 우선 사용합니다.
- `useFetch`/`useAsyncData`는 SSR payload와 hydration 흐름을 활용하므로, Nuxt의 기본 data loading 비교 기준으로 봅니다.
- 서버 전용 API, 환경 변수, DB/Supabase 접근은 `server/utils/` 또는 `server/api/`에 둡니다.
- 브라우저에서 직접 호출해야 하는 API는 `server/api/scenarios/{scenario-id}.get.ts`처럼 명시적으로 둡니다.
- app과 server가 모두 써야 하는 타입, fixture, 순수 transform은 `shared/`에 둡니다.

## SSR/API/Query 시나리오 구분

- Nuxt native SSR 성능을 비교하는 시나리오는 `useFetch`/`useAsyncData`와 Nitro server handler 흐름을 사용합니다.
- API endpoint 왕복 비용까지 비교하는 시나리오는 브라우저 interaction 이후 `$fetch`, `useFetch`, TanStack Query 등으로 `server/api`를 호출하고, 시나리오 이름이나 코드 주석에 API round trip이 의도임을 남깁니다.
- TanStack Query hydration/client cache를 비교하는 시나리오는 Nuxt native SSR 시나리오와 분리하고, query key, queryFn, initial data 또는 hydration 경계를 코드에서 드러냅니다.
- 기본은 `useFetch`/`useAsyncData`를 `await`하는 blocking SSR이라 `ttfb ≈ content-ready ≈ total`입니다. `lazy: true`는 payload를 늦게 채우므로 streaming 비교가 목적일 때만 쓰고, 이 경우 `ttfb`(셸)와 content-ready를 분리해 비교합니다.
- 예: `shopping-detail-ssr`, `shopping-detail-api`, `shopping-detail-query`처럼 목적별로 나누면 SSR payload 비용, API 왕복 비용, client cache 비용이 섞이지 않습니다.

## TanStack Query 기준

- 앱 루트에는 `plugins/vue-query.ts`로 `VueQueryPlugin`이 준비되어 있습니다.
- TanStack Query는 client cache, background refetch, pagination, infinite query, optimistic mutation에 사용합니다.
- Nuxt native data fetching만으로 충분한 SSR-only 시나리오에는 TanStack Query를 억지로 넣지 않습니다.
- query-managed 시나리오는 `app/composables/scenarios/{scenario-id}/use{ScenarioName}Query.ts`에 query key와 queryFn을 모읍니다.
- queryFn은 browser-safe fetcher만 import합니다. 서버 전용 모듈을 composable에서 직접 import하지 않습니다.
- 서버 prefetch/hydration이 필요한 경우 해당 시나리오에서 Nuxt payload와 TanStack Query cache가 각각 무엇을 담당하는지 명확히 남깁니다.

## Mutation 기준

- 서버 변경 요청은 `server/api/scenarios/{scenario-id}.post.ts` 같은 Nitro API handler를 우선 검토합니다.
- 단순 form submit과 redirect 중심 흐름은 Nuxt native form/API 흐름을 사용합니다.
- optimistic update, cache invalidation, background refetch가 핵심인 시나리오는 TanStack Query mutation을 검토합니다.
- mutation 이후 동기화 방식은 `refreshNuxtData`, query invalidation, optimistic rollback 중 하나를 명확히 선택합니다.

## 상태와 Pending UI 기준

- view가 직접 가져도 되는 상태는 modal, tab, input draft, hover/focus, 선택 표시처럼 순수 UI 상태로 제한합니다.
- 서버 데이터 원본, API 응답, cache 상태를 local state/ref로 중복 저장하지 않습니다.
- Nuxt native pending/error 상태와 TanStack Query 상태를 한 시나리오 안에서 섞을 때는 각 상태가 담당하는 범위를 명확히 나눕니다.
- hydration mismatch를 피하기 위해 브라우저 전용 값은 mounted 이후 계산하거나 client-only boundary를 사용합니다.

## Import와 서버 경계 기준

- Nuxt auto import에 기대도 되지만, 하네스 비교에서 책임이 흐려지는 경우 명시 import를 선호합니다.
- server-only 코드는 `server/` 아래에 둡니다.
- app/server 공용 코드는 `shared/` 아래에 둡니다.
- 무거운 client-only 라이브러리는 시나리오 component/composable에서만 import합니다.

## 성능 비교 유의사항

- 전역 plugin, 전역 CSS, auto import 대상 추가는 모든 프레임워크 비교에 필요한지 먼저 확인합니다.
- 비교 목적이 렌더링 성능이면 API 호출 비용과 구분되도록 `shared/scenarios/{scenario-id}/fixtures.ts` 같은 deterministic fixture를 사용합니다.
- 비교 목적이 data loading이면 `useFetch`, `useAsyncData`, `$fetch`, Nitro API, TanStack Query cache 중 무엇을 측정하는지 코드 이름으로 드러냅니다.
- Nuxt payload/hydration 흐름이 결과에 영향을 주면 코드나 문서에 짧게 남깁니다.
- production preview(`node .output/server/index.mjs`)는 `.env`/`.env.local`을 자동 로드하지 않습니다. SSR 성능 측정 시 Supabase 등 server env를 셸에 export한 뒤 서버를 띄웁니다(`next start`, `vite preview`는 자동 로드하지만 Nitro node 서버는 그렇지 않음).

## 시나리오 추가 체크리스트

- URL은 `/scenarios/{scenario-id}` 형태로 둡니다.
- page, view, composable, server API, server utility, shared fixture/type 책임이 분리되어 있습니다.
- view 파일은 하나의 UI surface만 export합니다.
- Nuxt native SSR, API round trip, TanStack Query cache 중 무엇을 측정하는지 시나리오 이름이나 코드 구조에서 드러납니다.
- `yarn lint`와 `yarn build`를 통과해야 합니다.
