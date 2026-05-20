---
name: ui-lab-lighthouse-benchmark
description: ui-lab에서 next-lab, sveltekit-lab, vue-lab, react-router-lab 같은 프레임워크 데모 앱의 Lighthouse 성능 비교를 준비, 실행, 수정, 설명할 때 사용합니다. 대상 설정, 로컬 production 기준의 공정한 측정, 결과 JSON 처리, iframe 화면 미리보기와 CLI 성능 측정의 차이를 다룹니다.
---

# UI Lab Lighthouse Benchmark

## Overview

`ui-lab` 모노레포에서 로컬 Lighthouse 성능 비교를 반복 가능하게 수행할 때 이 skill을 사용합니다. 실제 측정 주체는 Lighthouse CLI와 headless Chrome이며, Codex는 명령 준비, 실행 순서 관리, 스크립트/설정 수정, 결과 JSON 해석만 담당합니다.

사용자가 벤치마크 방식을 조사하거나 설계하거나 설명만 요청한 경우에는 Lighthouse, build, preview server를 실행하지 않습니다.

## 측정 대상

벤치마크 대상의 기준 파일은 `perf-results/lighthouse/targets.json`입니다. 현재 프레임워크 앱 구성은 다음과 같습니다.

- `next-lab`: `http://127.0.0.1:3001`
- `sveltekit-lab`: `http://127.0.0.1:3002`
- `vue-lab`: `http://127.0.0.1:3004`
- `react-router-lab`: `http://127.0.0.1:3005`

모든 대상은 같은 경로로 측정합니다. 기본 상품 SSR 시나리오 경로는 다음과 같습니다.

```bash
/shop/wireless-headphones-x1
```

## 측정 규칙

dev server가 아니라 production build 기준으로 측정합니다. 각 대상은 아래 순서로 처리합니다.

1. workspace 앱을 build합니다.
2. 해당 앱의 production server 또는 preview server만 시작합니다.
3. 측정 URL이 응답할 때까지 대기합니다.
4. 설정된 횟수만큼 Lighthouse CLI를 실행합니다.
5. 각 실행의 원본 Lighthouse JSON report를 저장합니다.
6. median run을 선택해 요약합니다.
7. 서버를 종료한 뒤 다음 대상으로 이동합니다.

대상은 순차 실행합니다. 여러 앱을 iframe으로 동시에 띄워 로딩 시간을 재면 브라우저 스케줄링, 공유 CPU, 네트워크 경합, 부모 페이지 작업이 결과에 섞이므로 성능 측정 기준으로 사용하지 않습니다.

## 성능 측정 주체

성능 수치는 Codex의 추정값이나 iframe load event가 아니라 Lighthouse CLI JSON에서 가져와야 합니다.

Lighthouse 명령 형태는 아래를 기준으로 합니다.

```bash
yarn lighthouse <url> \
  --quiet \
  --output=json \
  --output-path <report-path> \
  --only-categories=performance \
  --preset=<desktop|perf> \
  --chrome-flags="--headless=new --no-sandbox"
```

report에서는 다음 지표를 사용합니다.

- `categories.performance.score`: `performanceScore`
- `audits.first-contentful-paint.numericValue`: `fcpMs`
- `audits.largest-contentful-paint.numericValue`: `lcpMs`
- `audits.total-blocking-time.numericValue`: `tbtMs`
- `audits.cumulative-layout-shift.numericValue`: `cls`
- `audits.speed-index.numericValue`: `speedIndexMs`
- `audits.interaction-to-next-paint.numericValue`: 값이 있으면 `inpMs`

## 결과 파일

timestamp별 원본 report와 summary는 아래에 저장합니다.

```bash
perf-results/lighthouse/<timestamp>/
```

최신 결과는 아래 파일에도 갱신합니다.

```bash
perf-results/lighthouse/latest.json
```

결과 UI를 만들 때는 `latest.json` 또는 선택된 timestamp의 summary를 읽습니다. iframe preview는 화면 출력과 구현 동작 확인용으로만 사용하고, benchmark source로 사용하지 않습니다.

## 프로젝트 스크립트 지침

루트 스크립트는 다음과 같습니다.

```bash
yarn perf:lighthouse:quick
yarn perf:lighthouse
```

위 스크립트가 모든 프레임워크 앱을 측정한다고 말하기 전에 `scripts/lighthouse-compare.mjs`를 확인합니다. 일부 앱만 들어 있는 하드코딩 `targets` 배열이 남아 있다면 `perf-results/lighthouse/targets.json`을 읽도록 바꾸거나, 하드코딩 목록을 일관되게 확장합니다.

runner를 수정할 때는 아래 환경변수를 지원합니다.

- `LH_PATH`: 측정 경로, 기본값 `/`
- `LH_RUNS`: 실행 횟수, 기본값 `3` 또는 문서화된 프로젝트 기본값
- `LH_PRESET`: Lighthouse preset, 기본값 `desktop`
- `LH_CHROME_FLAGS`: Chrome flags, 기본값 `--headless=new --no-sandbox`

## Supabase 공정성 기준

측정 경로가 Supabase를 호출한다면 결과는 실제 backend latency가 포함된 end-to-end 앱 성능으로 설명합니다. 프레임워크 자체의 렌더링 차이를 비교하려면 mock/static-data 시나리오를 별도로 만들고 그 경로를 따로 측정합니다.

결과를 설명할 때는 어떤 모드인지 반드시 구분합니다.

- 실제 Supabase 경로: 앱 + 프레임워크 + backend/network 변동성이 포함됩니다.
- mock/static 경로: 프레임워크 렌더링과 bundle 동작에 더 가까운 비교입니다.

## 결과 보고

결과를 설명할 때는 다음을 포함합니다.

- 측정 경로, 실행 횟수, preset, 생성 timestamp
- 대상별 median score와 핵심 median metrics
- 실패한 build, server start, Lighthouse run
- 측정은 Lighthouse/Chrome이 수행했고 Codex는 실행 관리와 요약만 했다는 설명
