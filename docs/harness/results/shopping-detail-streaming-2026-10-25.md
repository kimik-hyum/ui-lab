# 상품 상세 스트리밍 전환 비교

2026-10-25 KST. React Router·SvelteKit·Nuxt의 상품 상세 경로를 스트리밍으로 바꾸고 같은 설치 버전에서 비교했습니다. Next.js는 기존 구현을 유지한 기준 대상입니다. 버전업과 이미지 최적화는 하지 않았습니다.

## 구현과 비교 범위

| 프레임워크 | 버전 | 변경 |
| --- | --- | --- |
| Next.js | 16.4.2 | 기존 loading.tsx와 서버 조회를 유지했습니다. |
| React Router | 7.18.4 | loader에서 조회 Promise를 반환하고 Suspense/Await로 상품 HTML을 스트리밍합니다. 조회 전에는 로딩 안내를 표시합니다. |
| SvelteKit | 3.1.0 | server load에서 Promise를 반환하고 {#await}로 처리합니다. 직렬화된 상품 데이터를 스트리밍하고 상품 HTML은 브라우저에서 완성합니다. |
| Nuxt | 4.6.2 | 상품 상세 경로에 experimental.ssrStreaming을 활성화했습니다. app.vue의 동기 wrapper가 첫 청크를 만들며 기존 await useFetch 조회는 유지합니다. 다른 경로는 blocking을 유지합니다. |

Nuxt 4.6.2의 서버 렌더러는 첫 Vue 청크를 얻은 뒤 셸을 보냅니다. NuxtPage만 루트로 둔 최초 시도에서는 상품 조회를 기다려 응답이 합쳐졌습니다. 동기 wrapper를 추가한 뒤에는 실제 응답에서 첫 청크와 상품 HTML이 나뉘는 것을 확인했습니다. 이 wrapper는 공통 DOM을 한 단계 감싸지만 다른 경로의 streaming 설정은 변경하지 않습니다.

React Router는 조회 결과를 기다리지 않으므로 route meta의 제목은 고정 제목을 사용합니다. 스트리밍 이후의 없는 상품·조회 실패는 오류 UI로 처리하며 HTTP 상태는 이미 전송돼 200으로 남을 수 있습니다. 인증·권한·정확한 404 상태가 필요한 서비스는 응답 전 검사를 별도로 설계해야 합니다.

## 측정 조건

- 경로: /scenarios/shopping-detail-ssr. 기본 상품 wireless-headphones-x1, 실제 Supabase와 같은 외부 상품 이미지 사용.
- Apple M1 Pro, Darwin 25.5.0, arm64, Node 24.22.1, Yarn 4.6.0. Lighthouse 13.1.0, Chrome 155, desktop, CPU 1배.
- 브라우저→앱·이미지, SSR 도구→앱, 앱→Supabase에 1 Mbps·추가 지연 100 ms. HTTP 본문 프록시와 DevTools 제한이며 실제 회선이나 외부 서버 변동을 완전히 고정한 실험은 아닙니다.
- 각 대상 production build 후 3회 예열. SSR 20회, Lighthouse 5회. 두 검사 축과 각 앱을 순차 실행했습니다.
- SSR은 지표별 중앙값과 p95, Lighthouse는 점수 기준 중앙 실행의 지표입니다. Lighthouse LCP를 독립 중앙값으로 해석하지 않습니다. INP는 미측정입니다.
- SSR 확인 문자열은 실제 조회 결과인 Wireless Headphones X1. SvelteKit의 content-ready는 데이터 도착이고 다른 세 앱은 상품 HTML 도착입니다. 화면 표시와 동일한 지표가 아닙니다.
- SSR 요청 User-Agent는 Lighthouse의 실제 emulatedUserAgent와 같은 일반 Chrome/136 문자열로 고정했습니다. 보고서의 엔진 User-Agent HeadlessChrome/155와는 다릅니다.
- 기존 SSR 도구 문자열과 HeadlessChrome 문자열은 React Router의 isbot에서 봇으로 판정됐습니다. 해당 초기 진단 기록은 보존하되 아래 전후 비교에서 제외했습니다.
- 동일한 도구 파일 묶음을 각 축의 전후에 고정했습니다. 묶음 SHA는 ssr-compare.mjs, lighthouse-compare.mjs, performance-history.mjs, performance-network.mjs 순서의 원본 바이트를 연결해 계산했습니다. 이후 저장용 응답 방식 설정을 경로별 renderingModes로 정리한 변경은 측정 중인 고정 도구에 반영하지 않았습니다.
- 측정 코드 기록은 9c957db + 미커밋 변경입니다. 변경 전에는 세 앱의 파일을 해당 커밋과 일치시켰고, 변경 후에는 이 보고서의 스트리밍 구현을 사용했습니다. lockfile과 의존성은 동일합니다.

## SSR 결과

단위 ms, 변경 전 → 변경 후. TTFB는 첫 body 청크이며 초기 안내 화면만 포함할 수 있습니다.

| 프레임워크 | 헤더 수신 | TTFB | 상품 HTML·데이터 도착 | 도착 p95 |
| --- | ---: | ---: | ---: | ---: |
| Next.js | 116.99 → 113.89 | 125.74 → 122.88 | 237.92 → 240.73 | 260.57 → 255.01 |
| React Router | 277.89 → 112.88 | 288.82 → 124.49 | 288.82 → 230.42 | 306.03 → 247.62 |
| SvelteKit | 276.83 → 113.40 | 288.76 → 234.56 | 288.76 → 239.51 | 304.28 → 249.00 |
| Nuxt | 277.31 → 116.03 | 286.28 → 122.47 | 286.28 → 238.86 | 306.15 → 253.13 |

첫 변경 후 SSR 묶음에서는 코드를 유지한 Next.js의 콘텐츠 도착이 237.92 → 303.24 ms로 변동하고 p95도 441.36 ms까지 늘었습니다. 이를 구현 효과로 해석하지 않고 네 앱 모두 같은 조건에서 한 번 더 측정했습니다. 위 표와 최신 스냅샷은 그 전체 재측정이며 첫 결과도 이력에 그대로 남겼습니다.

SvelteKit의 헤더 수신과 첫 body 도착 간격도 별도로 확인했습니다. 현재 `vite preview` 서버에 압축 없이 요청하면 초기 HTML과 상품 데이터가 두 청크로 도착하지만, gzip 요청에서는 압축 해제된 본문이 상품 데이터와 함께 한 번에 도착했습니다. 별도 로컬 진단에서 비압축 첫 청크/상품 도착은 약 28/180 ms, gzip은 약 175/175 ms였습니다. 정식 측정과 네트워크 경로가 다른 단일 진단값이므로 위 표에 합치지 않았습니다. 이 환경의 압축 버퍼링을 모든 SvelteKit 배포 환경의 특성으로 일반화하지 않습니다.

## Lighthouse 결과

| 프레임워크 | 점수 | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Next.js | 86 → 86 | 253.66 → 276.82 | 2,493.83 → 2,496.07 | 0.00 → 0.00 | 0.0000 → 0.0000 | 1,109.00 → 1,099.00 |
| React Router | 88 → 88 | 352.33 → 270.01 | 2,305.36 → 2,217.39 | 0.00 → 0.00 | 0.0000 → 0.0000 | 1,112.00 → 1,074.00 |
| SvelteKit | 91 → 82 | 366.25 → 334.62 | 1,816.94 → 2,527.27 | 0.00 → 0.00 | 0.0000 → 0.0100 | 1,393.00 → 2,073.00 |
| Nuxt | 82 → 81 | 358.21 → 272.30 | 3,318.50 → 3,401.27 | 0.00 → 0.00 | 0.0000 → 0.0000 | 591.00 → 508.00 |

| 프레임워크 | 변경 전 LCP 5회 범위 ms | 변경 후 LCP 5회 범위 ms |
| --- | ---: | ---: |
| Next.js | 2,489.31–2,546.78 | 2,489.80–2,504.77 |
| React Router | 2,266.26–2,350.83 | 2,214.42–2,238.95 |
| SvelteKit | 1,806.36–1,839.34 | 2,527.27–2,833.59 |
| Nuxt | 3,300.49–3,318.50 | 3,397.03–3,412.05 |

## LCP가 달라진 구간

[Chrome의 LCP 분석 지침](https://web.dev/articles/optimize-lcp)에 따라 점수 중앙 실행의 서버 응답·리소스 발견·다운로드·렌더 대기를 구분했습니다. 네 앱의 LCP 요소는 같은 상품 이미지이며 기존 프레임워크별 레이아웃은 유지했습니다. 프레임워크 간 순수 런타임 순위로 일반화하지 않습니다.

| 프레임워크 | 첫 응답 ms | 이미지 요청 시작 대기 ms | 이미지 로딩 ms | 렌더 대기 ms |
| --- | ---: | ---: | ---: | ---: |
| Next.js | 7.78 → 6.71 | 189.63 → 173.74 | 2,287.91 → 2,300.87 | 8.51 → 14.75 |
| React Router | 170.10 → 5.26 | 27.13 → 203.67 | 2,093.07 → 1,995.26 | 15.05 → 13.21 |
| SvelteKit | 175.08 → 3.41 | 26.21 → 1,021.24 | 1,595.25 → 1,491.04 | 20.40 → 11.58 |
| Nuxt | 182.51 → 4.63 | 37.73 → 175.74 | 3,088.90 → 3,213.06 | 9.35 → 7.83 |

- React Router는 초기 안내 화면을 더 일찍 표시했고 이번 반복에서는 LCP도 소폭 줄었습니다. 초기 응답 개선폭과 상품 이미지 표시 개선폭은 다릅니다.
- SvelteKit은 초기 HTML에서 상품 img가 사라지고 브라우저가 데이터를 받은 뒤 생성합니다. Lighthouse의 초기 문서 이미지 발견 여부가 true → false로 바뀌었고 이미지 요청 시작 대기가 크게 늘었습니다. 다섯 번 모두 변경 전보다 LCP가 늦었습니다. 데이터 스트리밍을 상품의 핵심 이미지까지 적용하면 이 조건에서는 불리했습니다.
- Nuxt는 첫 응답과 FCP가 빨라졌지만 LCP는 비슷한 수준이었습니다. 이미지 전송에 걸리는 시간이 여전히 가장 큰 구간입니다. 실험적 스트리밍을 켜는 것만으로 이미지 로딩 비용까지 줄지는 않았습니다.
- Next.js의 브라우저 LCP는 거의 같았습니다. 기준 대상의 초기 SSR 변동은 재측정으로 구분했으며 다른 앱 변경의 효과로 취급하지 않았습니다.

현재 구현은 요청대로 세 앱 모두 스트리밍을 유지합니다. 실제 상품 서비스라면 SvelteKit의 핵심 상품·이미지는 초기 HTML에 유지하고 추천·리뷰 같은 보조 데이터만 스트리밍하는 구성을 우선 검토할 수 있습니다. 이는 이번 측정을 바탕으로 한 제안이며 해당 혼합 구현을 측정한 결과는 아닙니다.

## 근거 기록

| 검사 | 변경 전 실행 ID | 변경 후 실행 ID |
| --- | --- | --- |
| SSR | ssr-2026-10-25T00-07-27-098Z | ssr-2026-10-25T00-19-13-063Z |
| Lighthouse | lighthouse-2026-10-24T23-52-47-146Z | lighthouse-2026-10-25T00-09-58-369Z |

- beforeSsr: `perf-results/ssr/2026-10-25T00-07-27-088Z/summary.json`
- afterSsr: `perf-results/ssr/2026-10-25T00-19-13-041Z/summary.json`
- beforeLh: `perf-results/lighthouse/2026-10-24T23-52-47-135Z/summary.json`
- afterLh: `perf-results/lighthouse/2026-10-25T00-09-58-358Z/summary.json`
- Ssr 도구 SHA-256: `2933d2b47945d6a16496f168b3215b61d438aa16824b539cadc4a9e25cd7a20c`
- Lh 도구 SHA-256: `f09d01f880aef7e61dae6d724e54e831c1bcd786b51aa75ccd208dec34858436`

## 공식 구현 문서

- [Next.js loading 공식 문서](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [React Router Suspense 공식 문서](https://reactrouter.com/7.18.4/how-to/suspense)
- [SvelteKit Promise streaming 공식 문서](https://svelte.dev/docs/kit/load#Streaming-with-promises)
- [Nuxt experimental ssrStreaming 공식 문서](https://nuxt.com/docs/4.x/guide/going-further/experimental-features#ssrstreaming)
