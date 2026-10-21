# 버전업 로그 형식과 화면 계약

## 원본과 작업 단위

- 저장 위치: `docs/upgrade-logs/YYYY-MM-DD-<scope>.json`. `id`는 파일명에서 `.json`을 뺀 값이다.
- [템플릿](../assets/upgrade-log.template.json)을 실제 값으로 채운다. 하나의 호환성 단위로 함께 이전한 패키지를 한 건으로 묶는다.
- 템플릿의 빈 문자열과 예시 줄 번호는 실제 값으로 바꾸고 `packages`를 채운다. 아직 코드 변경이 없는 `in-progress` 기록은 미완성 항목 대신 `changes: []`로 저장하고, 실제 변경 후 파일별 발췌를 추가한다.
- 후속 업그레이드는 새 파일을 만든다. 기존 기록의 정리 요청은 해당 기록을 수정하며, 당시 버전과 변경 사실을 보존한다.

## 기록할 내용

- **변경 코드**: 파일 경로와 짧은 전후 코드·설정 차이. 패키지 변경도 포함한다.
- **변경 이유**: 어떤 API·설정·호환성 조건 때문에 수정했는지 한두 문장으로 쓴다. 사용처 변경이 필요 없었다면 패키지 변경 항목에 이유를 적는다.
- **문서 지침**: 해당 변경에 적용한 공식 권고·필수 요구를 짧게 요약하고 출처를 연결한다. 프로젝트 자체 판단을 공식 권고처럼 쓰지 않는다.
- `summary`는 한 문장으로 쓴다. 전체 diff, 작업 순서, 명령 출력, 테스트 결과, 검증 시도·계획, 미실행 항목과 환경 장애 메모는 남기지 않는다.
- 버전 호환성이 선택 이유라면 관련 변경의 `reason`에 합친다. 별도의 검증·제약 섹션은 만들지 않는다.
- 검증은 스킬 절차에 따라 수행하되 로그에는 기록하지 않는다. 실행상 문제가 완료에 영향을 주면 대화에서 알린다.

## 데이터 필드

| 필드 | 의미 |
|---|---|
| `schemaVersion` | 현재 `2`. v1 입력은 읽을 수 있지만 실행 보고 필드는 표시하지 않는다. |
| `id`, `title`, `summary` | 고유 slug, 제목, 변경 요약 |
| `startedAt`, `updatedAt` | ISO 8601 시각. 한국 시간대는 `+09:00`을 명시한다. |
| `status` | `in-progress`, `completed`, `blocked`, `rolled-back` |
| `packages` | 앱별 선언 범위와 실제 설치 버전의 전후 |
| `sources` | 변경과 연결된 공식 문서의 ID, 제목, URL, 확인 날짜 |
| `changes` | 변경 코드, 이유와 문서 지침 |

```ts
type PackageChange = {
  workspace: string; // workspace name
  name: string;
  declaredBefore: string;
  declaredAfter: string;
  installedBefore: string;
  target: string; // 정확한 목표 버전
  installedAfter: string | null; // 설치 전이면 null
};

type UpgradeSource = {
  id: string;
  title: string;
  url: string;
  checkedOn: string; // YYYY-MM-DD
};

type UsageChange = {
  paths: string[]; // 저장소 상대 경로
  reason: string;
  before: string; // 짧은 코드 또는 설정·동작 차이
  after: string;
  recommendation: string | null; // 공식 문서 지침. 프로젝트 자체 판단이면 null
  sourceIds: string[]; // sources의 ID. 지침이 있으면 근거 문서를 반드시 연결
  files: FileCodeChange[]; // 새 코드 변경에는 필수. 원본을 복구할 수 없는 과거 기록만 빈 배열 허용
};

type FileCodeChange = {
  path: string; // paths에 속하는 파일
  excerpts: {
    before: { startLine: number; code: string } | null;
    after: { startLine: number; code: string } | null;
  }[];
};
```

- 발췌는 실제 변경 구간과 짧은 주변 코드만 포함한다. `startLine`은 해당 원본의 1부터 시작하는 줄 번호이며 `code`에 생략 기호나 설명문을 삽입하지 않는다.
- 같은 이유로 바꾼 파일은 한 변경의 `files`에 묶고, 이유나 문서 지침이 다르면 `changes` 항목을 나눈다. 파일 경로는 저장소 상대 경로로 쓰며 `paths`에 속해야 한다. `before`·`after` 요약은 짧게 유지하고 실제 코드는 `files[].excerpts`에 둔다.
- 패키지 선언도 바뀐 `package.json` 줄을 발췌한다. `yarn.lock`이나 생성물의 전체 diff를 복사하지 않는다. 새 로그에는 필요한 원본을 미리 확보해 `files`가 빠지지 않도록 한다.
- 새 파일은 `before: null`, 삭제 파일은 `after: null`로 표현한다. 전후 모두 null인 구간은 허용하지 않는다. 여러 변경 구간은 별도 발췌로 저장한다.
- 과거 기록을 정리하면서 변경 전 파일을 재구성할 근거가 없으면 `files`를 비우고 기존 요약을 사용한다. 이 예외를 새 버전업의 코드 비교 생략에 사용하지 않는다. Git HEAD에 없다는 이유만으로 이전부터 존재하던 미커밋 파일을 새 파일로 기록하지 않는다.
- v2에는 `checks`, `limitations`를 저장하지 않는다. 기존 기록을 정리할 때 해당 필드를 제거하고, 필요한 호환성 선택 이유만 `changes`로 옮긴다.
- 패키지·파일 경로·코드·문서 연결은 실제 변경을 바탕으로 쓴다. 환경변수 값이나 토큰을 포함하지 않는다.
- `completed`는 실제 설치와 스킬의 필수 검증을 마친 뒤에만 표시한다. 파서는 설치 버전·변경·출처의 존재를 확인하며, 검사 수행 여부를 대신 판단하지 않는다.

## 화면 계약

- Sidebar의 **버전업 로그** → `/upgrade-logs`, 상세는 `/upgrade-logs/[slug]`로 제공한다.
- 목록은 최신 `startedAt` 순으로 제목·상태·앱·버전 전후·요약을 보여준다. 부가 정보는 코드 변경 수와 문서 수만 표시한다.
- 기존 구현은 `apps/lab-shell/app/upgrade-logs`에 있다. `_components/UpgradeCodeDiff.tsx`가 펼치기·파일 선택·지연 로딩, `UpgradeFileDiff.tsx`가 전후 배치·hover, `_lib/code-diff.ts`의 `buildFileDiff`가 서버에서 변경 줄·대응 구간 계산을 맡는다. 다음 버전업은 이 구조에 로그 데이터만 추가한다.
- 파일 비교는 `apps/lab-shell/app/front-feature/components/ComparisonCodeBlock.tsx`를 수정 없이 재사용한다. 기존 코드 비교 컴포넌트에 로그 전용 기능을 추가하지 않는다.
- 변경 전은 왼쪽·빨강(삭제), 변경 후는 오른쪽·파랑(추가)으로 표시하고 좁은 화면에서는 위아래로 쌓는다. 기본은 모든 변경 줄 강조, hover 시 같은 변경 구간의 전후 줄을 함께 강조한다. 강조 줄과 대응 그룹은 저장된 코드에서 자동 계산하며 로그에 줄 번호 배열을 하드코딩하지 않는다.
- 원본 줄 범위는 각 코드 제목에 표시하고 뷰어 안의 줄 번호는 발췌 기준으로 유지한다. 새 파일·삭제 파일은 코드가 없는 쪽에 안내를 표시한다. 변경 이유와 문서 지침·출처는 해당 코드 비교와 같은 카드에 둔다.
- 상세는 코드 변경과 이유, 관련 문서 지침을 먼저 보여준다. 긴 코드·파일 목록과 패키지 버전표는 펼쳐서 읽게 한다. 테스트 결과·미실행·남은 검증·환경 메모 영역은 제공하지 않는다.
- `docs/upgrade-logs/*.json`을 단일 원본으로 사용한다. 로더·타입·표시 컴포넌트를 분리하고 기본 화면은 Server Component로 작성한다. standalone 빌드에도 원본을 포함한다.
- JSON은 `unknown`으로 읽고 필수 필드·상태·날짜·경로·문서 ID를 확인한다. 잘못된 기록은 파일명과 함께 오류를 알리며, 없는 slug는 `notFound()`로 처리한다.
- 내부 이동은 `next/link`를 사용한다. 문서는 `https:` 공식 출처를 연결하고 코드·문자열은 React 기본 escaping으로 표시한다.
- 형식 변경 시 타입·파서·템플릿·화면 계약을 함께 맞춘다.
