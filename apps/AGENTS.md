# AGENTS.md

이 파일은 `apps/` 아래의 모든 프레임워크 랩 앱에 적용됩니다.
Next.js, React Router, SvelteKit, Nuxt처럼 파일 규칙이 서로 다른 프레임워크라도 아래 공통 구현 규칙을 우선으로 따릅니다.

## 공통 하네스 구현 규칙

### 1. UI 파일은 하나의 UI surface만 export합니다
- `components`, `view`, `page`, route component 성격의 파일은 하나의 대표 UI만 노출합니다.
- React/Next 계열의 일반 UI 컴포넌트 파일은 가능하면 `default export` 또는 단일 named export 중 하나로 일관되게 유지합니다.
- helper, formatter, fetcher, mock, business logic, shared type은 view 파일에서 함께 export하지 않고 별도 파일로 분리합니다.
- 단, 프레임워크가 요구하는 route/page convention export는 예외로 허용합니다.
  - 예: Next.js의 `metadata`, `generateStaticParams`, route handler export
  - 예: React Router의 `loader`, `action`, `ErrorBoundary`, `HydrateFallback`
  - 예: SvelteKit의 `load`, `actions`, `GET`/`POST`
  - 예: Nuxt의 `definePageMeta`, server/api handler

### 2. View는 표현과 UI 상태만 담당합니다
- view는 렌더링, 사용자 입력 표현, 화면 조합만 담당합니다.
- view가 직접 가져도 되는 상태는 modal, tab, accordion, dropdown, input draft, hover/focus, 선택 표시, 가상화 스크롤 위치처럼 순수 UI에 가까운 상태로 제한합니다.
- 서버에서 받은 원본 데이터를 view state로 복제하지 않습니다.
- API 응답 정규화, 캐시 정책, mutation 성공/실패 정책, 비즈니스 규칙, 도메인 계산은 view가 아니라 scenario-local data layer나 framework data layer에 둡니다.
- 성능 비교에 영향을 주는 데이터 생성, 필터링, 정렬, 변환 로직은 view 파일에서 숨기지 않고 별도 모듈로 분리해 비교 가능하게 유지합니다.

### 3. 서버 데이터는 프레임워크 관용구를 우선합니다
- 초기 페이지 렌더링에 필요한 데이터는 각 프레임워크의 idiomatic server/data API를 우선 사용합니다.
  - Next.js: Server Component, `fetch`, route handler, 필요한 경우 Server Action
  - React Router: route `loader`, `action`, resource route
  - SvelteKit: `+page.server.ts`, `+layout.server.ts`, form actions, `+server.ts`
  - Nuxt: server/api, `useFetch`, `useAsyncData`, Nitro server utilities
- 서버에서 TanStack Query 사용은 허용합니다. 단, 목적은 서버 데이터 로딩 자체를 프레임워크 관용구에서 숨기는 것이 아니라, 클라이언트 remote state를 위한 prefetch, dehydrate, hydration을 구성하는 것입니다.
- 서버 데이터를 모두 TanStack Query로 통일하지 않습니다. 그렇게 하면 각 프레임워크의 핵심 데이터 로딩 모델을 비교하기 어렵습니다.
- TanStack Query는 브라우저에서 관리해야 하는 remote state에 사용합니다.
  - 예: background refetch, polling, optimistic mutation, pagination, infinite query, 사용자 상호작용 이후의 재검증
- Todo, pagination, infinite scroll, optimistic mutation처럼 클라이언트 캐시가 실무적으로 중요한 시나리오는 서버 prefetch까지 포함한 TanStack Query 사용을 우선 검토합니다.
- 순수 로컬 시나리오나 결정적 fixture 데이터만 쓰는 렌더링 테스트는 TanStack Query를 억지로 사용하지 않습니다.

### 4. SSR 응답 비교 시나리오는 streaming/blocking을 명시합니다

- SSR 응답 성능을 비교하는 시나리오에서는 각 프레임워크가 초기 데이터를 streaming으로 보내는지 blocking으로 보내는지 코드에서 드러나게 하고, 결과 문서에 표기합니다.
  - streaming 예: Next `loading.tsx`/`<Suspense>`, React Router deferred loader + `<Await>`, SvelteKit `load`의 streamed promise, Nuxt `lazy` fetch
  - blocking 예: 데이터를 `await`한 뒤 한 번에 렌더링
- 비교 1차 지표는 `ttfb`가 아니라 **content-ready**(핵심 콘텐츠가 HTML에 처음 들어온 시각)입니다. streaming 프레임워크의 낮은 `ttfb`는 셸 도착 시간이라 blocking 프레임워크와 직접 비교하면 오독합니다. 기준은 `docs/harness/performance-methodology.md`를 따릅니다.
- 한 시나리오 안에서 일부는 streaming, 일부는 blocking이면 `ttfb`가 섞입니다. 같은 비교 축이 필요하면 모드를 통일하거나 streaming 비교를 별도 시나리오 ID로 분리합니다.

### 5. 표현 포맷은 결정적으로 유지합니다

- 가격/날짜/숫자 포맷은 서버 환경(timezone/locale)에 의존하지 않도록 명시적으로 고정합니다. 예: `Intl.DateTimeFormat`에 `timeZone`과 locale을 명시합니다.
- 동일 시나리오를 여러 프레임워크로 구현할 때 같은 입력은 같은 출력이 나오도록 맞춥니다. 포맷이 프레임워크마다 다르면 SSR HTML 비교(바이트, 콘텐츠 diff)와 hydration 안정성이 흔들립니다.

## 구현 시 확인할 것

- 새 시나리오는 프레임워크별 파일 구조를 억지로 동일하게 맞추지 말고, route, data loading, mutation, UI, performance 측정 책임이 어디에 있는지 명확히 드러나게 배치합니다.
- 동일한 기능을 구현하더라도 각 프레임워크의 best practice를 따릅니다.
- SSR/data 시나리오는 not-found와 server error를 프레임워크 관용구의 error 경계로 처리합니다(Next `error.tsx`, React Router `ErrorBoundary`, SvelteKit `+error.svelte`, Nuxt `createError`/error page). 단순 시나리오라도 최소한 not-found 경로는 드러냅니다.
- 프레임워크별 구현 차이가 성능 결과에 영향을 줄 수 있으면 코드나 문서에 짧게 남깁니다.
