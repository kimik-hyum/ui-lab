# ui-lab monorepo

Yarn Berry(workspaces) 기반 모노레포입니다.

## Workspace

- `apps/lab-shell`: 기존 ui-lab Next.js 관리/비교 허브 앱
- `apps/next-lab`: Next.js 실험 앱
- `apps/sveltekit-lab`: SvelteKit 실험 앱
- `apps/vue-lab`: Nuxt SSR 실험 앱
- `apps/react-router-lab`: React Router v7 Framework Mode 실험 앱

## Docs

- `docs/architecture/react-next-architecture.md`: Next.js App Router 기반 React 앱의 권장 파일 구조와 데이터 흐름
- `docs/ui-lab-scout-20260329.md`: React/Next.js 기능 검증 리포트
- `docs/harness/workflow.md`: 프레임워크 비교 시나리오 구현 및 검증 절차
- `docs/harness/performance-methodology.md`: Lighthouse/SSR 성능 측정 기준
- `docs/harness/scenarios/shopping-detail-ssr.md`: 쇼핑 상세 SSR 시나리오 정의
- `docs/harness/results/shopping-detail-ssr.md`: 쇼핑 상세 SSR 성능 및 DX 비교 결과

## Framework Upgrades

프레임워크 버전업은 `skills/ui-lab-framework-upgrade/SKILL.md`의 절차를 사용합니다.
공식 이전 문서 확인, 의존성·사용처 변경, 검증과 변경 로그 기록을 한 작업으로 관리합니다.
프로젝트의 `.agents/skills`에서 스킬을 검색할 수 있으며, 다음과 같이 요청할 수 있습니다.

```text
$ui-lab-framework-upgrade 스킬로 next-lab과 lab-shell의 Next.js를 최신 안정 버전으로 올리고 변경 로그를 남겨줘.
```

**버전업 로그** 메뉴(`/upgrade-logs`)에서 이력 목록과 상세(`/upgrade-logs/[slug]`)를 확인할 수 있습니다.
`docs/upgrade-logs/*.json`이 단일 원본이며, 기록을 추가하면 메뉴에 자동으로 표시됩니다.
상세에는 변경한 코드·버전, 변경 이유와 관련 공식 문서 지침만 남깁니다. 테스트 결과·검증 시도·미실행 항목은 로그에 저장하지 않습니다.
로그 형식은 `yarn test:upgrade-logs`로 확인합니다. 필수 검증을 마친 작업만 `completed`로 기록합니다.

## Requirements

- Node.js 24.15 이상, 24.x (`.nvmrc`, `package.json` 및 Docker 이미지 기준)
- Yarn 4.6.0 (`packageManager` 기준)

Lighthouse 13은 Node.js 22.19 이상이 필요하므로 앱 실행과 성능 측정은 모두 Node.js 24에서 수행합니다.

## Install

```bash
nvm install
nvm use
corepack enable
yarn install --immutable
```

## Development

```bash
# 전체 앱 동시 실행
yarn dev:all

# lab-shell (기본)
yarn dev

# lab-shell (3003)
yarn dev:lab-shell

# next-lab (3001)
yarn dev:next-lab

# sveltekit-lab (3002)
yarn dev:sveltekit-lab

# vue-lab (3004)
yarn dev:vue-lab

# react-router-lab (3005)
yarn dev:react-router-lab
```

## Build

```bash
# 전체 workspace build
yarn build

# lab-shell만 build
yarn build:lab-shell
```

`lab-shell`은 빌드 중 `next/font/google`로 Josefin Sans를 내려받으므로 Google Fonts에 접근할 수 있어야 합니다.

## OpenAPI Types

Supabase Data API OpenAPI 스펙에서 공용 타입을 생성합니다. 생성 결과는 `packages/api-types`에 저장되고 각 실험 앱에서 `@ui-lab/api-types`로 참조합니다.

```bash
SUPABASE_URL=...
SUPABASE_SECRET_KEY=... # 또는 SUPABASE_SERVICE_ROLE_KEY
yarn generate:types:openapi
```

또는 Supabase Management API 토큰을 사용할 수 있습니다.

```bash
SUPABASE_PROJECT_REF=...
SUPABASE_ACCESS_TOKEN=...
yarn generate:types:openapi
```

기본 schema는 `public`이며, 필요하면 `SUPABASE_SCHEMA=...`로 바꿀 수 있습니다.

## Lighthouse Comparison

루트에서 아래 명령으로 Next.js, React Router, SvelteKit, Nuxt 실험 앱의 동일 경로를 측정합니다.
대상 앱과 포트는 `perf-results/lighthouse/targets.json`에서 관리합니다. Lighthouse 실행에는 Chrome 또는 Chromium이 필요합니다.

```bash
# 빠른 1회 측정
yarn perf:lighthouse:quick

# 기본 5회 측정
yarn perf:lighthouse
```

옵션:

```bash
# 네 앱에서 제공하는 쇼핑 상세 SSR 경로 측정, 5회 실행
LH_PATH=/scenarios/shopping-detail-ssr LH_RUNS=5 yarn perf:lighthouse
```

결과 파일:

- 타임스탬프별 원본: `perf-results/lighthouse/<timestamp>/`
- 최신 집계: `perf-results/lighthouse/latest.json`

## Vercel Project Split

각 앱은 별도 Vercel 프로젝트로 연결합니다.

- Project A -> `apps/lab-shell`
- Project B -> `apps/next-lab`
- Project C -> `apps/sveltekit-lab`
- Project D -> `apps/vue-lab`
- Project E -> `apps/react-router-lab`

## Supabase SSR Shopping Detail Demo

네 실험 앱은 같은 Supabase `public.products` 테이블을 조회해 `/scenarios/shopping-detail-ssr`에서 상품 상세를 SSR로 렌더링합니다.

| 앱 | 초기 데이터 로딩 | 로컬 주소 |
|---|---|---|
| Next.js | Server Component → 서버 helper → Supabase | `http://127.0.0.1:3001/scenarios/shopping-detail-ssr` |
| SvelteKit | `+page.server.ts` → 서버 helper → Supabase | `http://127.0.0.1:3002/scenarios/shopping-detail-ssr` |
| Nuxt | SSR `useFetch` → Nitro API → 서버 helper → Supabase | `http://127.0.0.1:3004/scenarios/shopping-detail-ssr` |
| React Router | route `loader` → 서버 helper → Supabase | `http://127.0.0.1:3005/scenarios/shopping-detail-ssr` |

기본 상품 slug는 `wireless-headphones-x1`이며, `?slug=<상품-slug>`로 조회 대상을 바꿀 수 있습니다.
Nuxt의 내부 API 경로는 `/api/scenarios/shopping-detail-ssr`입니다. 기존 `/shop/[slug]`와 `/api/products/[slug]` 경로는 제거되었습니다.

필수 환경변수(네 실험 앱 공통):

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

각 앱의 서버 실행 환경에 위 값을 설정합니다. 성능 측정 스크립트는 앱별 `.env`와 `.env.local`을 읽어 빌드 및 production 서버에 전달합니다.

마이그레이션 적용:

```bash
supabase db push
```

SSR 응답 측정:

```bash
SSR_PATH=/scenarios/shopping-detail-ssr \
SSR_EXPECT_TEXT="홈으로 이동" \
SSR_RUNS=20 SSR_WARMUP=3 yarn perf:ssr
```

Next.js는 `loading.tsx`를 통해 셸을 먼저 스트리밍하고 나머지 앱은 데이터를 기다린 뒤 응답합니다.
따라서 프레임워크 간 비교는 TTFB 대신 핵심 콘텐츠 도착 시각인 `content-ready`를 기준으로 합니다.
결과는 `perf-results/ssr/latest.json`에 저장됩니다.

Lighthouse와 SSR을 함께 점검하려면 다음 명령을 사용합니다. 기본값은 앱별 Lighthouse 5회, SSR 5회와 SSR warmup 3회입니다.
두 측정을 병렬로 실행하므로 정밀 벤치마크보다는 회귀 점검에 사용합니다.

```bash
PERF_PATH=/scenarios/shopping-detail-ssr \
SSR_EXPECT_TEXT="홈으로 이동" \
yarn perf:check
```

통합 결과는 `perf-results/performance/latest.json`에 저장됩니다.
