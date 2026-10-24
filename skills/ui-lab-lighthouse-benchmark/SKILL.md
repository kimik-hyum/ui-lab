---
name: ui-lab-lighthouse-benchmark
description: UI-LAB 프레임워크 앱의 Lighthouse·SSR 성능 비교를 준비·실행하거나 측정 결과와 버전별 분석 코멘트를 검토·기록할 때 사용합니다.
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

## 비교 후 분석 코멘트
- `docs/harness/performance-methodology.md`의 “프레임워크별 성능 분석 코멘트”에 따라 `docs/harness/performance-comments.json`에 측정한 프레임워크별 코멘트를 작성합니다. 부분 재측정은 해당 대상만 갱신합니다. 큰 차이가 없을 때도 짧은 관찰을 남깁니다.
- 버전 전후의 공식 변경 중 앱에 해당하는 것, 실제 코드 대응(시나리오 유지·호환성 이전·최적화), 관찰 결과와 원인 판단만 읽기 쉽게 씁니다. 코드 유지 상태에서 어떤 일이 생겼는지도 명시합니다.
- 공식 필수 수정과 선택 기능, 프로젝트의 판단을 구분합니다. 필수 수정 사용처를 찾지 못했다고 공식적으로 변경이 전혀 불필요하다고 쓰지 않습니다. 상관관계·원인 후보를 확정 원인으로 기록하지 않습니다.
- 큰 차이가 반복되면 공식 릴리스·이전 문서와 실제 의존성·코드 diff를 대조하고, 지연 구간을 나눠 근거를 확인합니다. 충분한 분석은 `docs/harness/results/`에 별도 작성하고 `reportPath`로 연결합니다. 원인 분리 실험은 일반 측정 이력과 분리합니다.
- `measurements`에는 `history.json`의 정확한 검사별 전후 실행 ID를 연결합니다. 같은 버전 쌍을 재분석하면 본문·근거·작성일을 함께 갱신하고, 다른 버전 쌍은 새 코멘트로 추가합니다. 이후 측정값을 과거 코멘트에 자동 대입하지 않습니다.
- `node --test scripts/performance-comments.test.mjs`로 근거 연결을 확인하고, lab-shell 재빌드 후 `/performance/history`의 해당 프레임워크에서 코멘트와 측정 근거가 읽히는지 확인합니다. 성능 분석을 코드 변경 전용 버전업 로그에 넣지 않습니다.
