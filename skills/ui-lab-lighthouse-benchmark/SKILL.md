---
name: ui-lab-lighthouse-benchmark
description: UI-LAB 프레임워크 앱의 Lighthouse 비교를 준비·실행하거나 측정 스크립트와 결과를 검토할 때 사용합니다.
---

# Lighthouse 비교

조사·설명만 요청받았다면 빌드·서버·측정을 실행하지 않습니다. 성능값은 Lighthouse/Chrome 보고서에서 가져옵니다.

## 실행 전
- `docs/harness/performance-methodology.md`, `perf-results/lighthouse/targets.json`, `scripts/lighthouse-compare.mjs`에서 현재 대상·옵션·실행 방식을 확인합니다. 앱·포트를 별도 목록에 복제하지 않습니다.
- 모든 대상에서 같은 시나리오 경로·입력·지연·캐시 조건을 사용합니다. 상품 SSR 경로는 `/scenarios/shopping-detail-ssr`입니다. `LH_PATH` 기본값은 `/`이므로 대상 경로를 명시합니다.
- 실제 Supabase 경로는 backend/network 비용을 포함합니다. 프레임워크 자체 비교는 결정적 fixture 시나리오와 구분합니다.
- 실행에 필요한 환경변수와 비어 있는 포트를 확인합니다. 이미 사용 중인 서버를 임의로 종료하지 않습니다.

## 측정
- 프로젝트 runner로 production build → 서버 준비 → 반복 측정 → 원본 저장 → 서버 정리를 순차 실행합니다.
- 빠른 점검은 `yarn perf:lighthouse:quick`, 기록용은 `LH_PATH=<경로> yarn perf:lighthouse`를 사용합니다. 기록용 Lighthouse는 최소 5회입니다.
- `yarn perf:check`의 기본 병렬 측정은 회귀 점검용입니다. 정밀 비교는 Lighthouse와 SSR을 분리 실행합니다.
- iframe 로딩 이벤트나 AI 추정값을 성능 측정값으로 사용하지 않습니다.

## 결과
- timestamp별 원본·summary와 `perf-results/lighthouse/latest.json`을 사용합니다. 기존 결과를 새 코드의 측정값으로 바꾸지 않습니다.
- 현재 runner는 performance score 기준 median run과 그 실행의 metrics를 함께 선택합니다. 이를 각 지표별 독립 median으로 설명하지 않습니다.
- score, FCP, LCP, TBT, CLS, Speed Index 등 보고서에 존재하는 값을 사용합니다. INP처럼 없는 지표는 추정하거나 0으로 채우지 않습니다.
- 경로·입력 조건·실행 횟수·preset·시각·결과 경로와 실패한 측정만 간결하게 보고합니다. SSR response·DX·AI 작업 점수와 합산하지 않습니다.
