# 성능 측정 방법론

UI Lab의 성능 비교는 하나의 종합 점수가 아니라 목적별 측정으로 나눕니다.
현재 확정된 성능 축은 Lighthouse와 SSR response입니다.

## 성능 축

### Lighthouse

브라우저 사용자 경험 성능을 측정합니다.

주요 지표:

- Performance score
- FCP
- LCP
- TBT
- CLS
- Speed Index
- INP

명령:

```sh
yarn perf:lighthouse
```

빠른 확인:

```sh
yarn perf:lighthouse:quick
```

환경 변수:

- `LH_PATH`: 측정 경로, 기본값 `/`
- `LH_RUNS`: 반복 횟수, 기본값 `5`
- `LH_MIN_RUNS`: 최소 반복 횟수, 기본값 `5`
- `LH_TARGETS`: 쉼표로 구분한 대상 이름
- `LH_PRESET`: Lighthouse preset, 기본값 `desktop`
- `LH_CHROME_FLAGS`: Chrome 실행 플래그

### Combined Check

Lighthouse와 SSR response를 같은 production server 기동 안에서 함께 확인합니다.
기본값은 5회이며, `PERF_MODE=parallel`에서는 Lighthouse run과 SSR request run을 동시에 시작합니다.
공식 기록용 정밀 비교는 경합 영향을 줄이기 위해 필요 시 개별 스크립트(`perf:lighthouse`, `perf:ssr`)로 다시 분리 측정합니다.

명령:

```sh
yarn perf:check
```

환경 변수:

- `PERF_PATH`: Lighthouse와 SSR에 함께 쓸 경로
- `PERF_RUNS`: Lighthouse/SSR 공통 반복 횟수, 기본값 `5`
- `PERF_MIN_RUNS`: 최소 반복 횟수, 기본값 `5`
- `PERF_TARGETS`: 쉼표로 구분한 대상 이름
- `PERF_MODE`: `parallel` 또는 `sequential`, 기본값 `parallel`
- `LH_*`, `SSR_*`: 개별 축만 override할 때 사용합니다.

### SSR Response

서버가 HTML 응답을 얼마나 빠르고 안정적으로 반환하는지 측정합니다.
Lighthouse와 달리 브라우저 렌더링, hydration, interaction 비용은 포함하지 않습니다.

주요 지표:

- `contentReadyMs`: 핵심 콘텐츠(`SSR_EXPECT_TEXT`)가 byte stream에 처음 등장한 시각. **프레임워크 간 비교의 1차 지표입니다.**
- `responseStartMs`: response header 수신까지 걸린 시간
- `ttfbMs`: 첫 body chunk 수신까지 걸린 시간. ⚠️ 스트리밍 프레임워크(예: Next App Router + `loading.tsx`)에서는 "셸 도착 시간"이므로 blocking 프레임워크의 ttfb와 직접 비교하지 않습니다.
- `totalMs`: HTML body 수신 완료까지 걸린 시간. 스트리밍에서는 flush 비용을 포함합니다.
- `htmlBytes`: HTML 응답 크기. 성능 저하가 아니라 아키텍처 차이(RSC payload, hydration 전략 등)를 반영합니다.
- `streamingDeltaMs`: `contentReadyMs - ttfbMs`. 0에 가까우면 blocking, 크면 스트리밍 셸을 먼저 보낸 것입니다.
- `status`: HTTP status

명령:

```sh
yarn perf:ssr
```

빠른 확인:

```sh
yarn perf:ssr:quick
```

환경 변수:

- `SSR_PATH`: 측정 경로, 기본값 `/`
- `SSR_RUNS`: 측정 반복 횟수, 기본값 `5` (기록용 결과는 최소 `20` 권장)
- `SSR_MIN_RUNS`: 최소 반복 횟수, 기본값 `5`
- `SSR_WARMUP`: 측정 전 버리는 워밍업 요청 수, 기본값 `3`
- `SSR_TARGETS`: 쉼표로 구분한 대상 이름
- `SSR_EXPECT_TEXT`: content-ready 측정과 필수 콘텐츠 체크에 쓰는 텍스트. **resolved 콘텐츠에만 존재하는 문자열로 지정합니다.** loading/shell에도 있는 텍스트(예: Next `loading.tsx`의 제목)를 쓰면 스트리밍 프레임워크의 셸을 콘텐츠로 오인합니다.

예:

```sh
SSR_PATH=/scenarios/shopping-detail-ssr \
SSR_EXPECT_TEXT="홈으로 이동" \
SSR_RUNS=20 yarn perf:ssr
```

## SSR 필수 체크리스트

아래 항목은 점수화하지 않고 통과/실패로 봅니다.

- 서버 HTML에 핵심 콘텐츠가 포함됩니다.
- 서버 응답 status가 기대값입니다.
- SSR, API round trip, TanStack Query cache 비용이 섞이지 않습니다.

## 제외한 항목

Hydration 전후 DOM 비교는 현재 하네스 기본 성능 축에서 제외합니다.
현재 시나리오들은 동적 화면 변화가 크지 않고, 우선순위는 SSR 응답 성능과 브라우저 성능을 분리하는 데 있습니다.

필요해지는 경우 별도 Playwright 기반 진단 체크로 추가합니다.

## 측정 규칙

- dev server가 아니라 build 후 preview/start 서버를 사용합니다.
- 기록용 결과는 quick(`SSR_RUNS=1`)을 쓰지 않습니다. 최소 `SSR_RUNS=20`으로 반복합니다.
- 측정 전 `SSR_WARMUP`(기본 3) 요청을 보내 결과에서 제외합니다. cold DNS/TLS/JIT 비용을 빼기 위함입니다.
- median 단독이 아니라 min / median / p95를 함께 봅니다.
- **프레임워크 간 비교는 `ttfbMs`가 아니라 `contentReadyMs`를 1차 기준으로 합니다.** `ttfbMs`는 streaming/blocking 모드가 같은 프레임워크끼리만 비교합니다.
- 각 프레임워크가 streaming인지 blocking인지 결과 표에 표기합니다.
- 측정 순서로 인한 cold-first 편향에 주의합니다. `ssr-compare`는 타깃을 순차 기동하므로 첫 타깃이 cold 비용을 떠안습니다. 워밍업으로 보정하고, 의심되면 순서를 바꿔 재현합니다.
- SSR response 결과와 Lighthouse 결과를 합산하지 않습니다.
- 시나리오 목적이 다르면 ID를 분리합니다. (예: blocking SSR 비교와 streaming 비교)
- 데이터 fetch 비용을 포함할지 여부는 시나리오 카드에 명시합니다.
- 인공지연 `0ms`는 타이머를 건너뛰는 조건으로 구현합니다. `setTimeout(0)`도 타이머 스케줄링을 거치므로 지연을 제거한 측정과 구분합니다. 구현을 바꾸면 새 빌드로 재측정하며 기존 수치를 일정 시간만큼 차감하지 않습니다.

## 측정 환경 기록

결과 문서에는 다음을 반드시 남깁니다. `ssr-compare`는 `summary.json`의 `environment`에 일부를 자동 기록합니다.

- 머신/OS, CPU, Node 버전, timezone
- 네트워크 환경
- Supabase endpoint 종류(local / cloud) 및 region
- `SSR_RUNS`, `SSR_WARMUP`, 측정 시각

## 결과 위치

- Lighthouse: `perf-results/lighthouse/`
- SSR response: `perf-results/ssr/`

각 실행은 timestamp 디렉터리에 `summary.json`을 저장하고, `latest.json`을 갱신합니다.

## 웹에서 버전별 기록 보기

- `/performance`는 최신 결과를 상세 비교합니다. `/performance/history`는 상단에 프레임워크별 최신 버전을 요약하고, 하단을 **프레임워크 → 버전 탭 → SSR·Lighthouse** 순서로 나눕니다. 각 검사는 최근 측정을 먼저 보여주고 이전 실행은 펼쳐서 확인합니다. 프레임워크마다 선택한 버전은 URL에 저장됩니다.
- `perf:ssr`, `perf:lighthouse`, `perf:check`는 대상 workspace의 **실제 설치 버전**, 코드 커밋과 미커밋 변경 여부, 측정 조건과 요약을 `perf-results/history.json`에 자동 누적합니다. 버전 범위만 있는 `package.json` 값을 설치 버전으로 사용하지 않습니다.
- `history.json`은 Git에 보관합니다. 큰 원본 보고서는 기존 timestamp 폴더에 남기고 웹용 기록에는 요약만 담습니다. 웹에 새 기록을 반영하려면 lab-shell을 재빌드합니다.
- 같은 실행 ID는 덮어쓰지 않으며, 부분 대상 측정·빠른 점검·병렬 점검도 원래 조건으로 기록합니다. 날짜가 가깝다는 이유로 서로 다른 SSR·Lighthouse 실행을 하나로 합치지 않습니다.
- 2026-05-31 기록의 버전은 해당 측정 스냅샷을 저장한 `ef08c64`의 `package.json`·`yarn.lock`과 2026-10-21 업그레이드 로그를 대조해 복원했습니다. 화면에 `이력에서 복원`으로 표시하며, 측정 코드 커밋을 추정해 채우지는 않습니다.

## 1 Mbps 네트워크 제한 비교

개별 `perf:ssr`, `perf:lighthouse` 실행에 `PERF_NETWORK_PROFILE=1mbps-100ms`를 지정합니다. 다운로드·업로드 설정은 1,000 Kbps, 추가 요청 지연은 100 ms, 브라우저 CPU 배율은 1입니다.

- Lighthouse는 `devtools` 방식으로 브라우저→앱·외부 이미지 요청을 제한합니다. 기존 desktop 시뮬레이션 결과와 구분합니다.
- SSR 도구→앱 및 앱→Supabase는 loopback 전용 HTTP 프록시를 거칩니다. 요청 전 50 ms, 응답 전 50 ms를 추가하고 응답 본문을 요청별 1 Mbps로 나누어 전송합니다. GET/HEAD만 허용하며 업로드 본문은 없습니다. 압축 바이트와 스트리밍 순서를 유지합니다.
- 실제 Supabase/이미지 서비스의 처리 시간과 인터넷 지연은 남습니다. 이는 동일한 **제한 설정** 비교이며, 외부 지연이 완전히 고정된 순수 프레임워크 벤치마크는 아닙니다. 운영체제 전체 네트워크 설정은 변경하지 않습니다.
- 서버 준비 후 각 축에서 3회 예열합니다. SSR 20회, Lighthouse 5회 이상을 순차 측정합니다. Lighthouse는 실행마다 새 브라우저 프로필을 사용합니다.
- `PERF_COMPARISON_ID`, `PERF_COHORT=before|current`, `PERF_HARNESS_SHA256`로 같은 도구의 버전업 전후 실행을 묶습니다. `PERF_TARGETS_PATH`로 비어 있는 별도 포트의 대상 명령을 지정하고, `LH_CLI_PATH`로 같은 Lighthouse CLI를 사용합니다.
- 이전 체크아웃에서 현재 runner의 절대 경로를 실행할 수 있습니다. `PERF_OUTPUT_ROOT`를 현재 저장소로 지정하면 과거 체크아웃의 소스·설치 버전을 현재 이력에 누적합니다. `PERF_UPDATE_LATEST=0`은 이전 버전 결과가 최신 스냅샷을 덮어쓰는 것을 방지합니다.
- 이전 lockfile과 현재 lockfile을 각각 그대로 설치합니다. React·Vue·Vite 등 함께 바뀐 의존성의 영향도 포함하므로 단일 패키지 버전만의 인과 효과로 해석하지 않습니다.
- 프록시에서는 HTTP 연결을 재사용하지 않습니다. 양쪽 버전에 동일하게 적용하지만, 실제 서비스의 연결 풀·keep-alive 정책을 그대로 재현한 측정은 아닙니다.
