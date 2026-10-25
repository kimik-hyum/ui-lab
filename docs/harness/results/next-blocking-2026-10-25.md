# Next.js 상품 상세 blocking SSR 변경 후 측정

Next.js 16.4.2의 상품 상세에서 `loading.tsx`를 제거하고, 상품 조회가 끝난 뒤 HTML을 응답하는 상태를 측정했습니다. React Router·SvelteKit·Nuxt는 스트리밍 변경 전의 blocking 구현을 유지합니다. 의존성 업그레이드나 이미지·번들 최적화는 추가하지 않았습니다.

사용자 요청에 따라 최종 분석 대상은 Next.js입니다. 범위 축소 전에 완료된 네 앱의 SSR 기록은 보존했으며, 다른 앱의 Lighthouse 측정은 중단했습니다. 완료된 Next.js 원본 5개만 결과에 사용했습니다.

## 측정 조건

- 경로: `/scenarios/shopping-detail-ssr`, 기본 상품 `wireless-headphones-x1`, 콘텐츠 확인 문자열 `Wireless Headphones X1`.
- 구현 기준: `f9286bc2500c9e6575d2bcfad9c5f795a8889c97`. 측정 당시 `dirty: true`는 측정 메타데이터·결과 표시 작업 때문이며, 네 실험 앱의 구현은 이 커밋과 같습니다.
- 설치 버전: Next.js 16.4.2, React 19.3.1, Supabase JS 2.103.0. production build와 `next start` 사용.
- 환경: Apple M1 Pro, Darwin 25.5.0 arm64, Node v24.22.1, Asia/Seoul.
- 네트워크: 다운로드·업로드 1,000 Kbps, 추가 지연 100ms, CPU 배율 1. 실제 cloud Supabase 연결(region 미기록), 실제 외부 상품 이미지 사용.
- SSR 도구→앱·앱→Supabase는 HTTP 본문 프록시, 브라우저→앱·이미지는 DevTools 제한입니다. 외부 서버 지연은 고정되지 않으며 두 축의 TTFB를 동일한 측정값으로 간주하지 않습니다.
- SSR 20회, Lighthouse 5회. 각 축의 서버 예열 3회는 제외했습니다. 두 축은 분리 실행했고, Lighthouse는 매회 새 브라우저 프로필을 사용했습니다.
- Lighthouse 13.1.0 / HeadlessChrome 155.0.0.0, desktop 1350×940. SSR 요청 User-Agent는 Lighthouse의 실제 요청 설정인 Chrome/136.0.0.0과 일치합니다.
- 비교 ID: `shopping-detail-blocking-2026-10-25` (`current`).

## SSR 결과

단위는 ms이며 HTML 크기만 B입니다. 20회 모두 HTTP 200·상품명 포함·콘텐츠 도착 확인을 통과했습니다.

| 지표 | 최소 | 중앙값 | p95 |
| --- | ---: | ---: | ---: |
| 응답 헤더 도착 | 262.66 | 286.64 | 301.56 |
| 첫 본문 도착(TTFB) | 276.22 | 297.66 | 312.13 |
| 상품 콘텐츠 도착 | 276.22 | 297.66 | 312.13 |
| HTML 전송 완료 | 298.83 | 320.88 | 338.78 |
| HTML 크기 | 9,949 | 9,949 | 9,949 |

모든 실행에서 첫 본문에 상품명이 포함됐습니다. 이는 이번 프록시·압축 조건에서의 관찰이며, 시간 차이가 0이라는 값만으로 blocking을 판정하지 않습니다. 별도의 500ms 응답 지연 검사에서 상품 데이터 준비 전 본문을 보내지 않고, 응답에 상품명과 `<img>` HTML이 포함되는 것도 확인했습니다.

## Lighthouse 결과

대표값은 **Performance 점수 순으로 정렬했을 때 중앙에 있는 실행(run 2)**의 지표입니다. 각 지표를 따로 정렬한 중앙값이 아닙니다.

| 지표 | 결과 |
| --- | ---: |
| Performance | 86 / 100 |
| FCP | 328.97 ms |
| LCP | 2,554.65 ms |
| TBT | 0 ms |
| CLS | 0 |
| Speed Index | 1,137.00 ms |
| INP | 미측정 |

| 실행 | Performance | LCP(ms) |
| --- | ---: | ---: |
| 1 | 86 | 2,526.00 |
| 2 (대표) | 86 | 2,554.65 |
| 3 | 86 | 2,535.09 |
| 4 | 86 | 2,542.94 |
| 5 | 85 | 2,568.85 |

5회 모두 `runtimeError`와 `runWarnings`가 없었습니다. 대표 실행의 LCP 요소는 상품 이미지이며 초기 문서에서 발견됩니다. LCP breakdown은 첫 바이트 169.39ms, 리소스 요청 대기 18.02ms, 이미지 로딩 2,355.16ms, 요소 렌더 대기 12.07ms입니다. 이 조건에서는 외부 이미지 로딩이 LCP의 대부분을 차지했습니다.

## 해석 범위

새 blocking 기준의 관찰값입니다. 이전 기록은 Next의 응답 방식, Node 버전 및 SSR 요청 User-Agent 등이 다르므로 전후 개선율을 계산하지 않습니다. 다른 프레임워크와의 순위도 이번 Next 단독 Lighthouse 결과로 판단하지 않습니다. 실제 Supabase·이미지 응답, 각 앱의 HTML·스타일·번들 차이가 포함되어 순수 프레임워크 실행 비용만 분리한 결과는 아닙니다.

이번 blocking 선택은 비교 조건을 맞추기 위한 프로젝트 결정입니다. Next의 `loading.tsx`가 자동 Suspense 경계를 구성하는 동작은 [공식 loading.js 문서](https://nextjs.org/docs/app/api-reference/file-conventions/loading)에 설명되어 있습니다.

## 기록과 원본

- SSR 실행 ID: `ssr-2026-10-25T00-48-37-788Z` (2026-10-25 09:48:37 KST 시작).
- Lighthouse 실행 ID: `lighthouse-2026-10-25T00-51-30-127Z` (첫 원본의 2026-10-25 09:51:30 KST `fetchTime`).
- Git에 보관한 측정 요약: `perf-results/history.json`. Next 단독 Lighthouse 결과는 전체 비교용 `perf-results/lighthouse/latest.json`을 덮어쓰지 않습니다.
- SSR 전체 원본: `perf-results/ssr/2026-10-25T00-48-37-754Z/summary.json`.
- Lighthouse 원본: `perf-results/lighthouse/2026-10-25T00-51-19-223Z/next-lab.run-{1..5}.json` 및 같은 폴더의 `summary.json`. 큰 원본 폴더는 기존 정책에 따라 로컬에 보관합니다.
- 전체 Lighthouse runner를 사용자 요청으로 중단해 마지막 summary 쓰기까지 도달하지 않았습니다. 완료된 Next 원본 5개를 검증한 뒤 runner와 동일한 점수 중앙 실행 규칙으로 Next 단독 summary·이력을 복원했습니다. `generatedAt`은 첫 원본의 `fetchTime`이며, 저장되지 않은 backend 요청 통계는 추정하지 않았습니다. 복원 설명은 로컬 summary의 `recovery`에도 남겼습니다.
- 측정 하네스 SHA-256: `093fe7311860eb442a7f925324e147df0f4a2cb355da2734b3ab284450e11d94`. `ssr-compare.mjs`, `lighthouse-compare.mjs`, `performance-history.mjs`, `performance-network.mjs` 순서로 파일 바이트를 이어 계산했습니다.
- 측정은 기존 개발 서버와 분리한 `127.0.0.1:3501`에서 수행했습니다. 재현 시 비어 있는 포트의 `PERF_TARGETS_PATH`를 지정하거나 기본 포트를 비우고, 같은 네트워크 설정·User-Agent와 `SSR_TARGETS=next-lab`, `LH_TARGETS=next-lab`, `SSR_RUNS=20`, `LH_RUNS=5`, `SSR_WARMUP=3`, `LH_WARMUP=3`을 사용합니다.
