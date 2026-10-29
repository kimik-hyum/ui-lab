# ui-lab monorepo

프론트엔드 프레임워크·라이브러리를 최소 구현으로 비교하고 실제 동작과 코드를 확인하는 Yarn workspaces 모노레포입니다.
브라우저 성능, SSR 응답, DX, AI 작업 품질은 서로 다른 평가 축으로 다룹니다.

## Workspace

- `apps/lab-shell`: 기존 ui-lab Next.js 관리/비교 허브 앱
- `apps/next-lab`: Next.js 실험 앱
- `apps/sveltekit-lab`: SvelteKit 실험 앱
- `apps/vue-lab`: Nuxt SSR 실험 앱
- `apps/react-router-lab`: React Router v8 Framework Mode 실험 앱

## Docs

- `docs/architecture/react-next-architecture.md`: Next.js App Router 기반 React 앱의 권장 파일 구조와 데이터 흐름
- `docs/harness/workflow.md`: 프레임워크 비교 시나리오 구현 및 검증 절차
- `docs/harness/performance-methodology.md`: Lighthouse/SSR 성능 측정 기준
- `docs/harness/scenarios/shopping-detail-ssr.md`: 쇼핑 상세 SSR 시나리오 정의
- `docs/harness/scenarios/dashboard-ssr.md`: 데이터 로딩·스트리밍·RSC 비교
- `docs/harness/scenarios/server-actions.md`: 실제 API·Server Action 제출과 서버 검증 비교
- `docs/harness/scenarios/request-cache.md`: 일반 서버 함수와 React cache의 요청 내 재사용 비교
- `docs/harness/scenarios/client-prerender.md`: Client Component의 최초 HTML과 브라우저 상호작용 비교
- `docs/harness/scenarios/framework-dashboard-ssr.md`: 네 프레임워크의 동일 대시보드 SSR
- `docs/harness/scenarios/list-virtualization.md`: React map·Virtuoso의 실제 DOM과 목록 이동 비교
- `docs/harness/scenarios/query-cache.md`: 수동 fetch·TanStack Query의 재조회와 캐시 재사용 비교
- `docs/harness/results/shopping-detail-ssr.md`: 쇼핑 상세 SSR 성능 및 DX 비교 결과

## AI 작업 설정

- 공통 규칙은 루트 `AGENTS.md`, 구현 규칙은 `apps/AGENTS.md`와 각 앱의 `AGENTS.md`에 둡니다.
- 각 위치의 `CLAUDE.md`는 `@AGENTS.md` 한 줄로 같은 지침을 가져옵니다. 하위 지침도 해당 폴더에서 로드되며 문서 본문은 복제하지 않습니다.
- 스킬 원본은 `skills/`에 두고 `.agents/skills`(Codex)와 `.claude/skills`(Claude Code)의 상대 심볼릭 링크로 공유합니다. 프로젝트를 이동해도 링크를 유지합니다.
- `.claude/commands`의 `plan`, `design`, `consult`는 프로젝트에 맞춘 계획·검토 명령입니다.
- 편집 후 자동 수정·오류 무시 훅과 `/tmp` 명령 기록 훅은 사용하지 않습니다. 검사 명령을 직접 실행해 결과를 확인합니다.

```sh
# 작업 중 해당 앱 검사 (Next는 ESLint, 나머지 앱은 각 프레임워크의 타입 검사)
yarn workspace lab-shell lint

# 서버 없이 실행하는 회귀 테스트
yarn test

# 코드·실행 설정 변경의 완료 검사: lint → test → build
yarn check

# 현재 코드의 lab-shell과 네 실험 앱을 실행한 뒤 SSR·캐시·초기 HTML을 검사
UI_LAB_BASE_URL=http://127.0.0.1:3003 yarn test:runtime
```

문서만 수정하면 경로·참조·내용 일치를 확인합니다. 상호작용 변경은 브라우저에서 관련 동작도 재현합니다.
`yarn test`는 실제 서버가 필요한 파일을 제외하고 조건부 서버 검사도 생략합니다. 이 항목은 `test:runtime`에서 실행하며, 기본 검사 통과로 대체하지 않습니다.
실험 앱은 기본 포트(3001/3002/3004/3005)를 사용합니다. 다른 주소라면 `UI_LAB_SSR_NEXT_ORIGIN`, `UI_LAB_SSR_SVELTEKIT_ORIGIN`, `UI_LAB_SSR_NUXT_ORIGIN`, `UI_LAB_SSR_REACT_ROUTER_ORIGIN`을 서버 설정과 일치시킵니다.
검사나 빌드는 실행 중인 서버의 산출물과 충돌하지 않는 환경에서 수행합니다.
지침·스킬 연결 변경 후에는 새 Codex/Claude Code 세션에서 사용합니다.
AI 비교 기록은 `docs/harness/ai-work-record-template.md`를 사용하며 일반 작업마다 평가 기록을 만들지는 않습니다.

공식 형식: [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Codex 스킬](https://learn.chatgpt.com/docs/build-skills), [Claude 지침 가져오기](https://code.claude.com/docs/en/memory#share-one-file-with-other-coding-tools), [Claude 스킬](https://code.claude.com/docs/en/skills#choose-where-skills-load).

## Framework Upgrades

프레임워크 버전업은 `skills/ui-lab-framework-upgrade/SKILL.md`의 절차를 사용합니다.
공식 이전 문서 확인, 의존성·사용처 변경, 검증과 변경 로그 기록을 한 작업으로 관리합니다.
Codex에서는 `$ui-lab-framework-upgrade`, Claude Code에서는 `/ui-lab-framework-upgrade`로 호출하거나 자연어로 버전업을 요청합니다.

```text
$ui-lab-framework-upgrade 스킬로 next-lab과 lab-shell의 Next.js를 최신 안정 버전으로 올리고 변경 로그를 남겨줘.
```

**버전업 로그** 메뉴(`/upgrade-logs`)에서 이력 목록과 상세(`/upgrade-logs/[slug]`)를 확인할 수 있습니다.
`docs/upgrade-logs/*.json`이 단일 원본이며, 기록을 추가하면 메뉴에 자동으로 표시됩니다.
상세에는 변경한 코드·버전, 변경 이유와 관련 공식 문서 지침만 남깁니다. 테스트 결과·검증 시도·미실행 항목은 로그에 저장하지 않습니다.
로그 형식은 `yarn test:upgrade-logs`로 확인합니다. 필수 검증을 마친 작업만 `completed`로 기록합니다.

## Requirements

- Node.js 24.x (로컬은 `.nvmrc`의 24.22.1, Vercel은 각 앱 `engines.node`의 `24.x`, Docker는 `node:24-alpine`)
- Vercel의 Node 패치 버전은 플랫폼에서 자동 관리합니다.
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

## UI-LAB 화면

홈(`/`)은 프로젝트 개요입니다. 실험실(`/void-ui`)에는 무한스크롤 같은 직접 구상한 아이디어 구현을 둡니다.
기능 비교는 React·Next.js·라이브러리·SSR 카테고리(`/front-feature/*`)에서 실행 결과와 코드를 비교합니다.
성능 측정(`/performance`)은 저장된 측정 결과와 조건을 별도로 보여줍니다.
실행 가능한 비교와 준비 중인 항목, 화면 시안을 구분해 표시합니다.

라이브러리 비교의 **전체 목록과 가상 목록**은 같은 100 / 1,000 / 10,000개 작업을 `map`과 설치된 `react-virtuoso`로 표시합니다.
실제 DOM 행 수와 처음·중간·끝 이동을 확인하고 코드에서 렌더 범위·고정 높이·이동 API를 비교합니다.
DOM 개수는 속도·메모리 사용량의 측정값이 아닙니다.

**캐시와 재요청**은 같은 API를 수동 `fetch`와 TanStack Query로 읽습니다. 항목을 닫았다 열고, 다른 항목과 오류 응답도 선택할 수 있습니다.
응답에는 700ms 인공 지연이 있으며, Query는 성공 결과를 60초 동안 재사용합니다. 표시된 요청 시도 수에는 취소된 요청도 포함됩니다.

프레임워크 비교의 **서버 HTML** 화면은 네 앱의 `/scenarios/dashboard-ssr`를 실제로 요청합니다.
공통 fixture와 0 / 400 / 800ms 서버 지연을 사용하며, 정상·빈 팀·404 상태를 선택할 수 있습니다.
네 실험 앱도 함께 실행해야 합니다. 기본 포트는 위 Development 절과 같습니다.
한 번의 서버 응답을 관찰하는 도구이며 브라우저 표시·hydration 성능이나 프레임워크 순위를 나타내지 않습니다.
추출한 HTML은 공통 CSS로 표시하고 스크립트는 실행하지 않습니다.

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
