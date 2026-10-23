# Result: shopping-detail-ssr

## Scenario

- Scenario ID: `shopping-detail-ssr`
- Route: `/scenarios/shopping-detail-ssr`
- Default slug: `wireless-headphones-x1`
- Measurement target: SSR response, DX score

## Framework Implementation

| Framework | Route/Data API | Data boundary | Query cache |
|---|---|---|---|
| Next.js | Server Component page | Route-local server helper -> Supabase | Not used |
| React Router | Route loader | `.server.ts` helper -> Supabase | Not used |
| SvelteKit | `+page.server.ts` load | `$lib/server` helper -> Supabase | Not used |
| Nuxt | SSR `useFetch` | Nitro API -> `server/utils` -> Supabase | Not used |

## SSR Response

이 시나리오는 실제 Supabase `products` 테이블을 호출합니다. 비교 1차 지표는 `ttfb`가 아니라 **content-ready**(핵심 콘텐츠가 HTML에 처음 들어온 시각)입니다. 자세한 기준은 `docs/harness/performance-methodology.md`를 따릅니다.

### 2026-10-23 재측정

- 기준 코드: `127ceda`. Next.js 16.4.2 / React 19.3.1, React Router 7.18.4, SvelteKit 3.1.0 / Svelte 5.57.2, Nuxt 4.6.2 / Vue 3.5.44.
- 환경: Apple M1 Pro, Darwin 25.5.0 arm64, Node v24.15.0, Asia/Seoul. 로컬 production 서버에서 동일한 Supabase cloud 상품을 조회했습니다. 외부 네트워크 왕복 비용을 포함하며 Supabase 리전은 확인되지 않았습니다.
- Supabase 사전 조회 1회(HTTP 200, 736.99ms)는 결과에서 제외했습니다. 각 앱에서 예열 3회 후 SSR 20회를 측정했습니다.
- SSR을 모두 마친 뒤 Lighthouse 13.1.0 desktop을 앱별 5회씩 별도 실행했습니다. 프레임워크별로 순차 진행했으며 SSR과 Lighthouse를 병렬 측정하지 않았습니다.

| Framework | SSR 방식 | Content-ready 최소 / 중앙 / p95 (ms) | Lighthouse 점수 | LCP (ms) |
|---|---|---:|---:|---:|
| Next.js | Streaming | 23.01 / 33.24 / 47.90 | 96 | 1403.20 |
| React Router | Blocking | 23.66 / 37.39 / 46.05 | 98 | 1171.45 |
| SvelteKit | Blocking | 30.10 / 35.79 / 63.94 | 98 | 1192.02 |
| Nuxt | Blocking | 25.10 / 37.60 / 56.00 | 98 | 1158.00 |

- SSR 80회 모두 HTTP 200 및 필수 콘텐츠 검사를 통과했습니다. Lighthouse 원본 20개에 runtime error는 없습니다.
- Lighthouse 점수는 점수 기준 중앙 실행이며, LCP도 그 실행의 값입니다. 지표별 독립 중앙값이 아닙니다. 해당 실행의 TBT와 CLS는 네 앱 모두 0이고 INP는 미측정입니다.
- Next.js의 Lighthouse 점수는 실행 순서대로 `86, 96, 96, 96, 96`이었습니다. 첫 실행을 제거하거나 재측정으로 대체하지 않았습니다. React Router의 `/favicon.ico` 404 로그는 있었으나 측정 대상 페이지는 정상 응답했습니다.
- 이번 SSR 중앙값 차이는 약 4ms입니다. 네트워크가 포함된 단일 시나리오이므로 프레임워크 자체의 우열이나 버전업 효과로 단정하지 않습니다. 아래 5월 기록과도 OS·네트워크·실행 조건이 달라 직접적인 개선율을 계산하지 않습니다.

실행 명령:

```sh
SSR_PATH=/scenarios/shopping-detail-ssr SSR_EXPECT_TEXT="홈으로 이동" SSR_RUNS=20 SSR_WARMUP=3 yarn perf:ssr
LH_PATH=/scenarios/shopping-detail-ssr LH_RUNS=5 LH_PRESET=desktop yarn perf:lighthouse
```

요약은 [SSR latest](../../../perf-results/ssr/latest.json), [Lighthouse latest](../../../perf-results/lighthouse/latest.json)에 저장했습니다. 로컬 원본 실행 디렉터리는 각각 `2026-10-23T03-38-45-788Z`, `2026-10-23T03-39-26-357Z`이며, 예열·버전·명령·서버 복구 정보는 각 디렉터리의 `execution-context.json`에 보관했습니다.

### 2026-05-31 측정 환경

- 머신: Apple M1 Pro, Darwin 24.5.0 (arm64)
- Node: v24.15.0, timezone Asia/Seoul
- Supabase: cloud (`*.supabase.co`), 상품 `wireless-headphones-x1`
- 설정: `SSR_RUNS=20`, `SSR_WARMUP=3`, content marker `홈으로 이동`
- 측정일: 2026-05-31
- 비고: build 후 preview/start 서버. next/sveltekit과 vue/react-router를 두 패스로 나눠 측정했고 두 패스 모두 warmup 3회를 적용했습니다. 현재 runner는 앱별 `.env`/`.env.local`을 production server 환경에 자동 주입합니다.

### 결과 (median, 20 runs)

| Framework | Streaming | Status | content-ready (median / p95) | ttfb (median) | total (median) | htmlBytes |
|---|---|---:|---:|---:|---:|---:|
| Next.js | yes (`loading.tsx`) | 200 | 70.00 / 162.43 | 5.25 (셸) | 70.57 | 11463 |
| React Router | no | 200 | 68.00 / 142.29 | 68.00 | 68.72 | 5975 |
| SvelteKit | no | 200 | 67.32 / 141.60 | 67.32 | 67.37 | 3492 |
| Nuxt | no | 200 | 68.78 / 136.14 | 68.78 | 68.98 | 5845 |

Command:

```sh
SSR_PATH=/scenarios/shopping-detail-ssr \
SSR_EXPECT_TEXT="홈으로 이동" \
SSR_RUNS=20 SSR_WARMUP=3 yarn perf:ssr
```

### 해석

- **content-ready 기준으로 네 프레임워크는 ~67–70ms로 사실상 동률입니다.** 이 시나리오의 지배 비용은 동일한 Supabase 단일 조회(클라우드 왕복)이고, 프레임워크 SSR 렌더 자체의 차이는 그 안에 묻힙니다. 즉 이 시나리오에서 성능은 변별력이 없고 DX가 실질 변별 축입니다.
- Next의 `ttfb` 5.25ms는 `loading.tsx` 셸이 먼저 스트리밍된 시각이며 콘텐츠 도착 시각이 아닙니다(`streamingDelta` ≈ 64.75ms). blocking 세 프레임워크는 `ttfb ≈ content-ready ≈ total`(`streamingDelta` 0)입니다. 따라서 `ttfb`로 프레임워크 우열을 매기지 않습니다.
- 이전 quick(`SSR_RUNS=1`) 결과의 Next `total` 292ms는 측정 순서상 첫 타깃이 떠안은 cold connection 아티팩트였습니다. warmup + 20 runs에서 70ms로 정상화되었습니다.
- `htmlBytes` 차이(SvelteKit 3492 < Nuxt 5845 < RR 5975 < Next 11463)는 성능 저하가 아니라 아키텍처 차이입니다(Next=RSC flight payload, 각 앱=hydration 전략, Svelte=컴팩트 출력).
- p95가 median의 2배 안팎으로 퍼지는 것은 클라우드 Supabase 왕복의 네트워크 지터 때문입니다. 로컬 Supabase로 측정하면 분산이 줄고 프레임워크 렌더 차이가 더 드러날 수 있습니다.

## Combined Lighthouse + SSR Check

아래 값은 같은 production server 기동 안에서 Lighthouse 5회와 SSR response 5회를 함께 실행한 회귀 체크 결과입니다.
`PERF_MODE=parallel`이므로 정밀 벤치마크보다는 smoke/regression check로 해석합니다.

```sh
PERF_PATH=/scenarios/shopping-detail-ssr \
SSR_EXPECT_TEXT="홈으로 이동" \
yarn perf:check
```

| Framework | LH score | FCP | LCP | TBT | CLS | SSR content-ready | SSR total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Next.js | 95 | 218.90 | 1466.79 | 0 | 0 | 53.56 | 54.10 |
| React Router | 96 | 369.73 | 1381.55 | 0 | 0 | 87.91 | 88.59 |
| SvelteKit | 95 | 338.03 | 1451.34 | 0 | 0 | 71.95 | 71.99 |
| Nuxt | 96 | 505.16 | 1404.99 | 0 | 0 | 67.04 | 67.07 |

Notes:

- 실행 횟수: Lighthouse 5회, SSR 5회, SSR warmup 3회
- React Router에서 Lighthouse가 `/favicon.ico`를 요청하며 404 로그를 남겼지만, 측정 대상 route와 SSR checklist는 통과했습니다.

## DX Score

Mutation이 없는 SSR-only 시나리오이므로 `Mutation 및 동기화 난이도`는 `N/A`로 둡니다.

| Framework | Weighted Score | 근거 요약 |
|---|---:|---|
| Next.js | 4.72/5 | Server Component page와 route-local server helper/view model 경계가 가장 짧고 명확합니다. `notFound()`와 `loading.tsx`도 App Router 관용구에 맞습니다. |
| React Router | 4.44/5 | `routes.ts` 등록, route loader, `.server.ts` helper가 명확합니다. route config와 route module 파일이 추가되어 단순 SSR 대비 파일 수는 조금 늘어납니다. |
| SvelteKit | 4.61/5 | `+page.server.ts`와 `$lib/server` helper가 SSR 경계를 잘 드러냅니다. page는 얇고 view/format helper가 route-local로 모여 탐색성이 좋습니다. |
| Nuxt | 4.17/5 | `useFetch(server:true)` + Nitro handler + server util이 Nuxt 관용구에 맞습니다. 다만 SSR-only 비교에서도 Nitro API layer가 필요해 다른 앱보다 개념 수와 해석 주의점이 많습니다. |

## DX Item Scores

| 항목 | Next.js | React Router | SvelteKit | Nuxt |
|---|---:|---:|---:|---:|
| 프레임워크 관용구 적합성 | 5.0 | 4.5 | 5.0 | 4.5 |
| 데이터 흐름 명확성 | 5.0 | 5.0 | 5.0 | 4.0 |
| View 책임 분리 | 4.5 | 4.0 | 4.5 | 4.5 |
| 상태와 Pending 처리 | 4.0 | 4.0 | 4.0 | 4.0 |
| Mutation 및 동기화 난이도 | N/A | N/A | N/A | N/A |
| 파일 구조 탐색성 | 5.0 | 4.5 | 4.5 | 4.0 |
| 코드량과 개념 부담 | 4.5 | 4.0 | 4.5 | 3.5 |
| 타입 안정성과 계약 명확성 | 4.5 | 4.5 | 4.0 | 4.5 |
| 측정/디버깅 용이성 | 5.0 | 5.0 | 5.0 | 4.0 |

## Checklist

- [x] legacy `/shop/[slug]` 및 `/api/products/[slug]` 구현을 제거했습니다.
- [x] 네 프레임워크 모두 `/scenarios/shopping-detail-ssr`를 제공합니다.
- [x] 서버 HTML에 `Scenario: Shopping Detail SSR`와 상품 핵심 정보가 포함됩니다.
- [x] `yarn lint`가 통과합니다.
- [x] `yarn build`가 통과합니다.
- [x] 실제 Supabase 기준 `SSR_PATH=/scenarios/shopping-detail-ssr SSR_EXPECT_TEXT="홈으로 이동" SSR_RUNS=20 SSR_WARMUP=3 yarn perf:ssr`가 통과합니다(4개 앱 status 200, content-ready/expected-text 체크 통과).
