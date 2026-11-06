# UI 선호도 설문 DB

마이그레이션 원본은 이 저장소의 `supabase/migrations/`에 둡니다. `Survey`는 Google 로그인 후 아래 RPC로 실제 응답을 저장합니다. 로그인 전까지 표 비교와 선택은 누구나 가능합니다.

## Google 로그인 연결

- `apps/lab-shell/.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 설정합니다. 공개 클라이언트용 키만 사용하며, Service Role 키·Google Client Secret은 프론트엔드에 넣지 않습니다. 배포 환경에서는 빌드 전에 같은 공개 환경변수를 등록해야 합니다.
- Supabase Google 제공자에 웹 OAuth Client ID·Secret을 등록합니다. Google의 승인된 리디렉션 URI는 `https://<project-ref>.supabase.co/auth/v1/callback`입니다.
- Supabase Redirect URLs에는 앱의 정확한 `http://localhost:3003/auth/callback`, 외부 도메인의 `/auth/callback`을 등록합니다. 임시 터널 주소가 바뀌면 새 주소를 등록하고 이전 주소는 제거합니다. 모든 터널을 허용하는 와일드카드는 사용하지 않습니다.
- 사유 입력 후 비로그인 상태이면 Google 로그인으로 이동하고, 복귀 시 선택한 항목과 사유를 제출합니다. 이미 로그인한 사용자는 바로 제출합니다. Google 기본 프로필·이메일 외의 추가 권한은 요청하지 않습니다.
- 현재 인증은 설문용 클라이언트 PKCE 흐름입니다. 세션과 로그인 초안은 같은 탭의 `sessionStorage`에 보관합니다. 새로고침에는 유지되고 탭을 닫으면 사라지며, 서버 렌더링에 로그인 상태를 전달하지 않습니다. 초안은 최대 30분 동안 복원합니다.
- `/auth/callback`에서 일회용 코드를 교환하고 저장을 마친 뒤 원래 설문·탭으로 돌아옵니다. 취소·만료·네트워크·저장 오류에서는 초안을 복원하고 재시도를 제공합니다. 저장 성공 후 새로고침이 다시 제출을 일으키지 않습니다.
- 테스트 모드의 Google OAuth 앱은 Google Cloud Audience에 등록한 테스트 계정만 이용할 수 있습니다. 일반 공개 전에는 OAuth 앱의 게시 상태와 운영 도메인을 설정합니다.

인증 코드는 `app/lib/survey-client.ts`, 복귀 데이터 검증은 `app/lib/survey-auth-state.ts`, 화면 상태는 `app/components/useSurveySubmission.ts`에서 관리합니다. 프론트엔드가 전달한 사용자 ID를 신뢰하지 않고 DB의 `auth.uid()`와 RLS로 권한을 확인합니다.

공식 안내: [Google 로그인](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## 테이블

| 테이블 | 역할 / 제약 |
| --- | --- |
| `surveys` | 고정 `survey_key`, 제목, radio/checkbox, 최소·최대 개수, draft/open/closed |
| `survey_options` | 고정 ID·`option_key`, 표시 이름·순서·활성 여부. `(survey_id, option_key)` 고유 |
| `survey_responses` | 사용자별 현재 응답·전체 선택 사유. `(survey_id, user_id)` 고유 |
| `response_options` | 응답에 선택된 항목. `(response_id, option_id)` 기본키, 복합 외래키로 같은 설문임을 보장 |

사용자는 Supabase의 `auth.users`를 참조합니다. 계정을 삭제하면 해당 사용자의 응답과 선택 항목도 함께 삭제합니다. 사유는 선택 사항이며 최대 300자입니다.

## 등록된 설문

| survey_key | 방식 | 최소 | 최대 | option_key |
| --- | --- | --- | --- | --- |
| `responsive-tables-flat-v1` | radio | 1 | 1 | scroll, sticky, cards, priority, popin, expand |
| `responsive-tables-inner-v1` | checkbox | 2 | 3 | scroll, sticky, cards, stacked |

키와 표시 이름은 `apps/lab-shell/app/void-ui/responsive-tables/table-patterns.ts`에 대응합니다. UUID는 DB가 생성하고, 프론트엔드는 안정적인 설문·선택지 키를 전달합니다. 배열 인덱스로 응답을 저장하지 않습니다.

## 제출 계약과 권한

로그인 사용자는 `submit_survey_response(p_survey_key text, p_option_keys text[], p_reason text default '')`를 RPC로 호출합니다. 반환값은 저장된 응답 UUID입니다.

```ts
const { data: responseId, error } = await supabase.rpc('submit_survey_response', {
  p_survey_key: 'responsive-tables-inner-v1',
  p_option_keys: ['cards', 'sticky'],
  p_reason: '요일별로 묶여 있어 비교하기 편합니다.',
});
```

- 함수가 `auth.uid()`에서 사용자를 결정합니다. 요청에 `user_id`를 받지 않습니다.
- 익명 방문자는 공개된 설문·선택지만 읽습니다. 초안 설문과 모든 사용자 응답에는 접근할 수 없습니다.
- 로그인 사용자는 본인 응답·선택 항목만 읽습니다. 비활성 선택지도 공개 설문에서 조회할 수 있으므로 화면에서 선택 가능 항목은 `is_active = true`로 필터링합니다.
- `anon`·`authenticated`의 테이블 직접 쓰기는 금지합니다. 쓰기는 검증 함수만 허용합니다.
- 함수는 `SECURITY DEFINER`, 빈 `search_path`, 명시적인 스키마 경로를 사용합니다. `PUBLIC`·`anon` 실행 권한을 회수하고 `authenticated`에만 부여합니다. 운영 관리 역할은 별도로 신뢰합니다.
- 제출 시 설문 공개 상태, 선택 개수, 중복·빈 값·배열 차원, 선택지 소속·활성 여부, 사유 길이를 검증합니다.
- 응답과 선택 항목은 한 트랜잭션으로 저장합니다. 실패하면 이전 응답을 보존합니다.
- 설문이 열려 있는 동안 재제출은 기존 응답을 교체합니다. 동시 제출은 응답 행 잠금으로 직렬화되어 마지막으로 처리된 완전한 응답을 저장합니다. 변경 이력·낙관적 잠금은 현재 범위에 포함하지 않습니다.

## 설문 변경 규칙

- 설문 ID·키, 선택지 ID·소속·키, 응답 ID·소유자·소속·최초 제출 시각은 트리거로 변경을 차단합니다.
- 초안에서 선택지를 구성한 뒤 `open`으로 전환합니다. 공개 시 활성 선택지가 최소 2개이며 `max_selections` 이상이어야 합니다.
- 공개 후 선택 방식·최소·최대 개수 및 선택지 구성의 추가·삭제를 금지합니다. 조건을 바꾸려면 `v2`처럼 새 설문을 만듭니다. `draft`로 되돌려 이 규칙을 우회할 수 없습니다.
- 표시 순서·제목은 수정할 수 있습니다. 의미가 달라지는 UI 변경은 새 버전으로 취급합니다.
- 선택지 비활성화는 가능하되 열린 설문에서 최대 선택 개수를 충족할 수 있어야 합니다. 필요하면 먼저 설문을 닫습니다.
- 공개 설문·선택지는 삭제하지 않습니다. 설문은 `closed`, 선택지는 `is_active = false`로 처리해 기존 응답을 보존합니다.

## 오류 코드

| 오류 메시지 | 화면 처리 |
| --- | --- |
| `survey_login_required` | 초안을 유지하고 로그인 안내 |
| `survey_not_open` | 설문 상태를 갱신하고 제출 불가 안내 |
| `survey_selection_count_invalid` | 최소·최대 선택 개수 안내 |
| `survey_selection_invalid` | 잘못된 선택 목록을 재확인 |
| `survey_option_unavailable` | 최신 선택지를 다시 읽고 재선택 안내 |
| `survey_reason_too_long` | 사유 300자 제한 안내 |

인증 만료나 네트워크 실패의 초안 보존은 클라이언트에서 처리합니다. 전체 결과를 공개할 때는 사용자별 원문 응답 권한을 풀지 말고 집계 조회를 별도로 추가합니다.

## 검증과 배포

```bash
# Docker가 실행된 환경. 호스트 포트 없는 임시 PostgreSQL 컨테이너에서만 실행합니다.
yarn test:survey-db

# 기존 마이그레이션과 원격 이력을 먼저 확인한 뒤 신규 파일만 적용합니다.
supabase link --project-ref <대상-project-ref>
supabase migration list --linked
supabase db push --dry-run
supabase db push
```

`test:survey-db`는 PostgreSQL 17 기반 Supabase 이미지에서 전체 마이그레이션을 재생하고 `supabase/tests/survey.sql`의 pgTAP 검증과 서로 다른 세션의 동시 제출을 실행합니다. 테스트 데이터는 임시 컨테이너에만 존재하며 종료 시 컨테이너를 제거합니다. 기본 `yarn test`에는 Docker를 요구하지 않습니다.

이미 적용한 파일을 수정하지 않고 새 마이그레이션을 추가합니다. 원격 `db reset`을 사용하지 않습니다. DB 비밀번호·관리 토큰·Service Role 키는 환경변수나 자격 증명 저장소에서 읽고 Git에 넣지 않습니다.

참고: [Supabase 마이그레이션](https://supabase.com/docs/guides/local-development/database-migrations), [함수 보안](https://supabase.com/docs/guides/database/functions#secure-a-database-function), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
