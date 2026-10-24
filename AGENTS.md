# UI-LAB 작업 지침

## 목적
- 다양한 프론트엔드 프레임워크·라이브러리를 최소 구현으로 비교합니다.
- 사용자가 실제 동작과 변경 코드를 확인할 수 있게 합니다.
- 브라우저 성능, SSR 응답, 개발 경험(DX), AI 작업 품질은 각각 평가합니다. 관찰값과 측정값을 구분합니다.
- 모든 응답은 한국어로 작성합니다.

## 작업 범위와 문서
- 기존 미커밋 변경을 보존하고, 요청한 작업에 필요한 부분만 수정합니다.
- 파일을 수정하기 전에 루트부터 대상 폴더까지의 `AGENTS.md`를 읽습니다. 구체적인 앱 규칙은 해당 앱에서 적용합니다.
- `apps/lab-shell`: 공통 화면과 기능 비교 허브. 나머지 네 앱은 프레임워크별 실험 대상입니다.
- 새 비교 시나리오는 `docs/harness/workflow.md`, 성능 측정은 `docs/harness/performance-methodology.md`를 참고합니다.
- 설계·조사만 요청한 경우에는 구현이나 벤치마크를 실행하지 않습니다. 이미 요청받은 구현은 같은 승인을 반복해서 묻지 않습니다.

## 스킬
원본은 `skills/`에 두며 Codex의 `.agents/skills`, Claude Code의 `.claude/skills`에서 같은 원본을 참조합니다. 관련 작업에서만 읽습니다.

- 기능 비교 추가: `skills/front-feature-comparison-workflow/SKILL.md`
- 프레임워크·관련 도구 버전업: `skills/ui-lab-framework-upgrade/SKILL.md`
- Lighthouse 벤치마크: `skills/ui-lab-lighthouse-benchmark/SKILL.md`

버전업은 공식 문서, 의존성·lockfile, 실제 사용처를 함께 갱신합니다. `docs/upgrade-logs/*.json`에는 파일별 전후 코드, 변경 이유와 공식 문서 지침만 기록합니다. 테스트 결과·검증 시도는 대화에서 보고하며 로그에 넣지 않습니다. 버전 차이 조회만으로 업그레이드하지 않습니다.

## 명령과 완료 기준
Node와 Yarn 버전은 `.nvmrc`와 루트 `package.json`을 따릅니다. 아래 명령은 저장소 루트에서 실행합니다.

- 개발 서버: `yarn dev` 또는 `yarn dev:<앱 이름>`
- 작업 중 대상 앱 검사: `yarn workspace <앱 이름> lint`
- 기존 회귀 테스트: `yarn test` (일부만 실행할 때는 `node --test scripts/<이름>.test.mjs`)
- 실제 서버 검사: 현재 코드의 lab-shell과 네 실험 앱을 실행한 뒤 `UI_LAB_BASE_URL=<주소> yarn test:runtime`. 기본 테스트에는 서버가 필요하지 않습니다.
- 코드·실행 설정 변경 완료: `yarn check` (`yarn lint` → `yarn test` → `yarn build`)
- 문서만 변경했다면 경로·내용의 일치 여부를 확인합니다. 문구를 그대로 비교하는 테스트는 추가하지 않습니다.
- 상호작용을 변경하면 해당 동작을 브라우저에서 재현하고 새로고침·직접 진입·오류 경로 중 관련 항목을 확인합니다. 코드 비교를 변경하면 hover 토픽·줄 하이라이트·스크롤 매칭도 확인합니다.
- 실행한 검사와 결과, 해결하지 못한 문제를 짧게 보고합니다. 통과하지 않은 검사를 통과했다고 기록하지 않습니다.
