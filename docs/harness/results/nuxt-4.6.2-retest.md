# Nuxt 4.6.2 재측정과 4.4.5 이후 변경 대조

2026-10-23 KST. 상품 상세 SSR 시나리오, 같은 장비·도구·1 Mbps·추가 지연 100 ms로 재측정했습니다.

## 결과

| 측정 | SSR 콘텐츠 도착 | LCP | Lighthouse |
| --- | ---: | ---: | ---: |
| 4.4.5 기존 기록 | 327.87 ms | 2,727.89 ms | 85 |
| 4.6.2 첫 기록 | 331.04 ms | 3,335.29 ms | 82 |
| 4.6.2 재측정 | 335.60 ms | 3,290.14 ms | 82 |

- 재측정은 첫 기록 대비 SSR +1.4%, LCP −1.4%입니다. 큰 LCP 차이가 반복됐습니다.
- 4.4.5 대비 재측정 LCP는 +562.25 ms, +20.6%입니다. 앱과 함께 바뀐 의존성 전체의 차이이며 Nuxt 단일 변경의 인과 효과로 확정하지 않습니다.
- 각 SSR은 20회 중앙값, 각 Lighthouse는 5회 중 **점수 중앙 실행의 지표**입니다. LCP 독립 중앙값과 다릅니다.
- LCP 5회 범위는 4.4.5: 2,727.89–3,131.44 ms, 첫 4.6.2: 3,308.08–3,588.58 ms, 재측정: 3,290.14–3,596.45 ms입니다.
- SSR 재측정 min/median/p95는 325.00/335.60/348.65 ms입니다. 기존 분포와 겹칩니다.

## 어디에서 시간이 늘었나

점수 중앙 실행의 Lighthouse LCP 구간입니다. [Chrome의 LCP 분석 지침](https://web.dev/articles/optimize-lcp)에 따라 서버 응답·리소스 발견·로딩·렌더 대기를 나눴습니다.

| LCP 구간 | 4.4.5 | 첫 4.6.2 | 재측정 4.6.2 |
| --- | ---: | ---: | ---: |
| 첫 응답 | 204.75 ms | 183.14 ms | 162.52 ms |
| 이미지 로딩 시작 대기 | 34.38 ms | 57.12 ms | 36.33 ms |
| 이미지 리소스 로딩 | 2,480.49 ms | 3,087.34 ms | 3,085.10 ms |
| 로딩 후 렌더 대기 | 8.27 ms | 7.69 ms | 6.20 ms |

LCP 요소는 모두 같은 상품 `<img>`입니다. 이미지 전송량도 124,061 B로 같고, TBT는 모두 0 ms입니다. 이번 차이는 서버 처리나 긴 JavaScript 실행보다 **이미지 리소스 로딩 구간**에 집중됩니다. 이 구간에는 외부 CDN 응답·연결·전송·다른 요청과의 경합이 함께 들어갑니다.

초기 높은 우선순위 JavaScript는 기존 큰 파일 1개(약 195 KB) 중심에서 큰 파일 2개(약 105 KB·83 KB)와 추가 파일들로 구성이 달라졌습니다. 로컬 Script·Stylesheet 전송량은 224,797 → 235,530 B, 전체 전송량은 약 356 → 380 KB로 증가했습니다. 낮은 우선순위의 오류 페이지 미리받기 4개도 관찰됐습니다. 이들은 HTTP 오류가 아니라 상태 200의 정상 리소스 요청입니다.

## 미리받기 차단 진단

최신 앱의 코드·설정은 유지하고, 별도 Lighthouse 진단에서 오류 페이지 JS·CSS 4개만 차단했습니다. 실제 차단 패턴과 전송량 0 B를 원본 보고서에서 확인했습니다.

| 조건 | LCP, 점수 중앙 실행 | Lighthouse | LCP 5회 범위 |
| --- | ---: | ---: | ---: |
| 일반 재측정 | 3,290.14 ms | 82 | 3,290.14–3,596.45 ms |
| 오류 페이지 미리받기 4개 차단 | 3,213.96 ms | 82 | 3,199.40–3,213.96 ms |

차단 시 −76.18 ms(−2.3%)로 줄었지만 4.4.5보다 여전히 +486.07 ms(+17.8%)입니다. **이 미리받기 4개만으로 전체 차이를 설명하기 어렵습니다.** 실행 순서는 일반 → 차단이며 외부 CDN 조건을 완전히 통제한 교차 실험은 아니므로, 76 ms를 미리받기의 확정 비용으로 해석하지 않습니다. 이 진단은 일반 성능 이력과 합치지 않았습니다.

## 공식 변경 중 현재 앱에 해당하는 것

4.4.6–4.4.8, 4.5.0–4.5.2, 4.6.0–4.6.2의 공식 릴리스를 검토하고 실제 설치 패키지와 시나리오 소스를 대조했습니다.

| 변경 | 현재 앱의 해당 여부 | 이번 차이와의 관계 |
| --- | --- | --- |
| 4.5: Vite 8·Rolldown 전환 | **직접 해당.** Vite 7.3.3 → 8.3.4, 최신 Rolldown 1.2.14 | 번들 분할·초기 요청 구성에 영향을 주는 최우선 후보. 실제 큰 JS 파일 구성도 달라졌습니다. [4.5 릴리스](https://github.com/nuxt/nuxt/releases/tag/v4.5.0), [전환 PR](https://github.com/nuxt/nuxt/pull/34256) |
| 함께 갱신된 vue-bundle-renderer 2.2.0 → 2.4.0 | **직접 해당.** SSR의 preload·prefetch 생성에 사용 | 2.3은 동적 import 미리받기 계산을, 2.4는 리소스 해석을 변경했습니다. 요청 구성 변화와 대조할 후보이며 단독 원인은 미확정입니다. [2.3](https://github.com/nuxt-contrib/vue-bundle-renderer/releases/tag/v2.3.0), [2.4](https://github.com/nuxt-contrib/vue-bundle-renderer/releases/tag/v2.4.0) |
| 4.6: 클라이언트 prefetch 스케줄러 통합 | **일부 해당.** 화면에 홈 이동용 NuxtLink 1개가 있음 | 링크·경로 청크의 미리받기에 적용됩니다. SSR HTML이 만든 오류 페이지 미리받기와 동일 원인으로 단정하지 않습니다. [스케줄러 PR](https://github.com/nuxt/nuxt/pull/36391) |
| 4.5: Unhead 3 / Unctx 3, 4.6: 기본 오류 화면 변경 | 런타임 의존성과 기본 오류 화면에 해당 | Unhead 2.1.15 → 3.4.3, Unctx 2.5.0 → 3.0.1. 앱의 useHead는 제목 설정이며 렌더 대기 증가가 관찰되지 않아 우선순위는 낮습니다. [4.5](https://github.com/nuxt/nuxt/releases/tag/v4.5.0), [오류 화면 PR](https://github.com/nuxt/nuxt/pull/36255) |
| useFetch·useAsyncData 변경 | 기본 composable 사용 경로에 해당. 새 addon·serialize:false 등은 사용하지 않음 | 단일 await useFetch로 상품을 조회합니다. 중복 Supabase 호출이나 큰 SSR 시간 증가는 관찰되지 않아 LCP 차이의 우선 후보는 아닙니다. [4.6 릴리스](https://github.com/nuxt/nuxt/releases/tag/v4.6.0) |
| 4.6: NuxtLink SSR 최적화 | 링크 1개에 해당 | 공식 다중 링크 벤치마크의 향상률을 이 앱 전체에 적용할 수 없습니다. 이미지 다운로드 차이를 설명하는 변경도 아닙니다. [링크 SSR PR](https://github.com/nuxt/nuxt/pull/36015) |

새 기능이 모두 활성화되는 것은 아닙니다. `nuxt.config.ts`에는 experimental streaming·early404·prefetchPreloadTags·Vapor·새 Vite 서버 빌더를 켜는 설정이 없습니다. 실제 Nitro 엔진은 양쪽 모두 2.13.4이며, 측정한 상품 경로는 정상 SSR 응답입니다. 개발 서버 시작 최적화·CLI 화면·타입 수정도 이번 production LCP의 우선 후보에서 제외했습니다.

## 현재 판단과 다음 원인 분리

재현된 현상은 **최신 의존성 조합의 리소스 로딩 차이**입니다. Vite·Rolldown의 번들 구성과 vue-bundle-renderer의 힌트 생성이 가장 먼저 좁혀볼 대상입니다. 새 스케줄러나 기본 오류 화면 변경만을 원인으로 확정할 근거는 부족합니다.

추가 실험을 한다면 4.4.8 → 4.5.2 → 4.6.2로 구간을 나누어 Vite 8 전환 전후 중 어느 구간에서 벌어지는지 먼저 확인하는 편이 좋습니다. 이후 한 요소씩 분리하고, 외부 CDN 변동을 제외한 별도 로컬 이미지 fixture 측정을 병행하면 네트워크 경합과 프레임워크 처리를 구별할 수 있습니다. 공식 기록은 실제 Supabase·외부 이미지를 사용한 기존 시나리오로 계속 구분합니다.

## 재현 정보

- 일반 재측정: SSR 20회·Lighthouse 5회, 축별 3회 예열, 성공 응답·필수 콘텐츠 확인. 별도 차단 진단 Lighthouse 5회.
- 같은 Apple M1 Pro·Darwin 25.5.0·Node 24.15.0·Chrome 155·Lighthouse 13.1.0. 브라우저 CPU 1배, 실행마다 새 프로필.
- 일반 재측정의 도구 SHA-256: `5a26f040c7d4899de4c1c489afc877ef0e47c59336b42b270c6312260ae58a02`.
- 일반 재측정은 기존 비교 ID `upgrade-1mbps-20261023T050205Z`에 추가 실행으로 누적했습니다. 소스는 `0866394`와 측정에 영향 없는 성능 화면 미커밋 변경입니다. Nuxt 앱과 lockfile은 변경하지 않았습니다.
- Supabase 응답 SHA-256은 이전·첫 최신·재측정이 일치합니다. 재측정의 backend 요청은 SSR 24건, Lighthouse 9건이며 모두 200입니다.
- SSR 원본: `perf-results/ssr/2026-10-23T05-49-08-357Z/summary.json`.
- Lighthouse 원본: `perf-results/lighthouse/2026-10-23T05-49-33-956Z/summary.json`.
- 별도 진단 원본: `perf-results/lighthouse/diagnostic-nuxt-prefetch-20261023T055305Z/perf-results/lighthouse/2026-10-23T05-53-05-735Z/summary.json`.
- 일반 재측정만 `perf-results/history.json`에 추가했습니다. `/performance/history#vue-lab`에서 최신 4.6.2 측정과 같은 버전의 첫 측정을 함께 확인할 수 있습니다. 전체 프레임워크 묶음인 `latest.json`은 부분 측정으로 대체하지 않았습니다.
