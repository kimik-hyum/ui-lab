# Nuxt 실험 앱

공통 비교 조건은 상위 `apps/AGENTS.md`를 따릅니다.

## 현재 파일 배치
- 현재 앱은 루트 `pages/`, `components/`, `composables/`, `plugins/`, `server/`, `shared/` 구조입니다. 새 시나리오도 이 구조를 유지합니다.
- 라우트는 `pages/scenarios/{scenario-id}.vue`, UI는 `components/scenarios/{scenario-id}/`에 둡니다.
- 브라우저 composable은 `composables/scenarios/{scenario-id}/`, 서버 helper는 `server/utils/scenarios/{scenario-id}.ts`에 둡니다.
- API는 필요한 경우 `server/api/scenarios/{scenario-id}.get.ts` 또는 `.post.ts`로 둡니다.
- 공용 fixture·타입·변환은 `shared/scenarios/{scenario-id}/`에 둡니다. `app/` srcDir 전환은 별도 작업입니다.

## 데이터와 갱신
- 초기 데이터는 Nuxt의 `useFetch`·`useAsyncData`와 SSR payload/hydration 흐름을 우선합니다.
- 서버 환경변수·DB 접근은 `server/`에 제한하고 브라우저 composable에 import하지 않습니다.
- 클라이언트 API 왕복이 비교 대상이면 endpoint와 요청 시점을 명시합니다.
- 기본 `VueQueryPlugin`은 준비되어 있습니다. Query를 함께 쓰면 Nuxt payload와 Query cache의 역할을 나눕니다.
- mutation 이후 `refreshNuxtData`, Query invalidation, rollback 중 사용할 동기화를 명확히 합니다.
- SSR HTML에 핵심 데이터가 들어오는지 실제 응답으로 확인합니다. `lazy` 옵션만으로 서버 streaming 여부를 판단하지 않습니다.
- 오류·not-found는 `createError` 등 Nuxt의 오류 경계에서 처리합니다.

## 실행과 검사
- 서버/클라이언트 양쪽의 데이터 포맷은 동일하게 유지하고 브라우저 전용 값으로 hydration 결과를 바꾸지 않습니다.
- `yarn workspace vue-lab lint`는 Nuxt 타입 검사를 실행합니다.
- production `node .output/server/index.mjs` 실행에는 필요한 환경변수를 전달합니다. 성능 runner의 환경변수 로딩은 `docs/harness/performance-methodology.md`를 참고합니다.
