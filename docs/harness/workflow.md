# 하네스 엔지니어링 워크플로우

이 문서는 UI Lab에서 하나의 기능을 여러 프레임워크로 구현하고, 성능과 DX를 비교하기 위한 작업 절차입니다.
긴 기능별 문서를 계속 늘리지 않고, 짧은 시나리오 카드와 프레임워크별 `AGENTS.md`를 기준으로 진행합니다.

## 목표

- 하나의 기능을 동일한 사용자 시나리오로 정의합니다.
- 각 프레임워크는 자기 관용구에 맞게 구현합니다.
- SSR, API round trip, TanStack Query cache, 렌더링 성능을 섞지 않고 목적별로 분리합니다.
- Lighthouse 성능, SSR 응답 성능, DX 점수를 별도 축으로 기록합니다.

## 기준 문서

- 공통 구현 규칙: `apps/AGENTS.md`
- Next.js 기준: `apps/next-lab/AGENTS.md`
- React Router 기준: `apps/react-router-lab/AGENTS.md`
- SvelteKit 기준: `apps/sveltekit-lab/AGENTS.md`
- Nuxt 기준: `apps/vue-lab/AGENTS.md`
- 시나리오 카드: `docs/harness/scenario-card-template.md`
- DX 점수: `docs/harness/dx-rubric.md`
- 성능 측정: `docs/harness/performance-methodology.md`

## 작업 순서

### 1. 기능 제안

메인 에이전트는 만들 기능을 시나리오 카드 형태로 정리합니다.
이 단계에서는 긴 설계 문서를 만들지 않습니다.

필수로 정할 항목:

- `Scenario ID`
- `Goal`
- `Measurement Target`
- `Route`
- `Required States`
- `Required Interactions`
- `Data Source`
- `Allowed Optimizations`
- `Not Allowed`

### 2. 가능성 및 측정 방향 검토

메인 에이전트는 기능이 어떤 비교 목적에 가까운지 먼저 분류합니다.

- SSR 응답 성능
- API round trip
- TanStack Query client cache
- 렌더링/상호작용 성능
- DX 비교

SSR HTML에 핵심 콘텐츠가 들어있는지는 필수 체크리스트입니다.
점수화하지 않고 실패 조건으로 다룹니다.

### 3. 기준 기능 매핑

React 또는 Next.js 기준으로 필요한 기능과 메서드를 나열합니다.

예:

- Server Component
- Route Handler
- Server Action
- Suspense/loading boundary
- TanStack Query query/mutation
- optimistic update
- virtualized rendering

### 4. 프레임워크별 대응 조사

서브에이전트는 각 프레임워크의 `AGENTS.md`를 참고해 대응 방식을 정리합니다.

조사 결과에는 다음을 포함합니다.

- 사용할 route/data/mutation API
- 파일 배치
- SSR/API/Query 중 어떤 시나리오인지
- 해당 프레임워크다운 이유
- 성능 측정에 영향을 줄 수 있는 차이
- 피해야 할 shortcut

### 5. 메인 검토

메인 에이전트는 서브에이전트 결과를 다시 검토합니다.

검토 기준:

- 동일 사용자 행동을 비교하는가
- 같은 데이터와 같은 상태를 다루는가
- 프레임워크별 관용구를 지켰는가
- SSR, API, Query 비용이 섞이지 않았는가
- TanStack Query를 넣는 이유가 명확한가
- view/data/mutation/query 책임이 분리되었는가

### 6. 조정 및 확정

불명확한 부분은 구현 전에 조정합니다.
측정 목적이 바뀌면 시나리오 ID를 분리합니다.

예:

- `shopping-detail-ssr`
- `shopping-detail-api`
- `shopping-detail-query`

### 7. 구현

각 프레임워크 앱의 `AGENTS.md` 기준으로 구현합니다.
동일한 UI 결과와 동일한 사용자 행동을 유지하되, 파일 구조와 API 선택은 프레임워크 관용구를 따릅니다.

### 8. 검증

필수 검증:

- `yarn lint`
- `yarn build`
- route smoke check
- SSR 필수 콘텐츠 체크

필요 시 추가:

- Playwright 상호작용 체크
- API response contract 체크
- query invalidation/optimistic rollback 체크

### 9. 성능 측정

성능 측정은 목적별로 분리합니다.

- Lighthouse: 브라우저 사용자 경험 성능
- SSR response: TTFB, total response time, HTML bytes
- DX score: 구현 난이도와 유지보수성

### 10. 결과 정리

결과는 기능별 장문 문서보다 짧은 요약을 우선합니다.

포함할 내용:

- 시나리오 ID
- 프레임워크별 구현 방식
- 측정 환경
- 성능 결과
- DX 점수
- 해석 시 주의할 점
- 다음 조정 후보

## 완료 기준

- 시나리오 카드가 작성되어 있습니다.
- 네 프레임워크의 대응 방식이 검토되었습니다.
- 구현이 각 앱의 `AGENTS.md` 기준을 따릅니다.
- `yarn lint`와 `yarn build`가 통과합니다.
- Lighthouse 또는 SSR response 중 시나리오 목적에 맞는 성능 결과가 남아 있습니다.
- DX rubric 기준으로 점수가 기록되어 있습니다.
