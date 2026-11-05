# UI-LAB 화면과 기능 비교

## Next.js 구현
- App Router의 서버 컴포넌트를 기본으로 하고, 브라우저 API·이벤트·상태가 필요한 컴포넌트에만 `'use client'`를 둡니다.
- 앱 라우팅은 `next/link`, 이미지 최적화는 비교 목적에 맞는 경우 `next/image`를 사용합니다.
- React 화면은 기존 Tailwind·공통 컴포넌트를 재사용합니다. SyntaxHighlighter 스타일은 필요한 것만 import합니다.

## 화면 기준
- 공통 화면은 `app/components/AppShell.tsx`와 `Sidebar.tsx`입니다. 색상·간격은 `app/globals.css`, 메뉴는 `app/lib/lab-navigation.ts`, 공통 조작은 `components/ui/`의 shadcn Base UI 컴포넌트를 따릅니다. `public/previews/responsive-layout/`은 이전 디자인 시안입니다.
- PC에서는 넓은 작업 공간을 활용하고, 태블릿·모바일에서는 내용 잘림과 가로 넘침 없이 재배치합니다.
- 홈은 프로젝트 개요입니다. 실험실(`/void-ui`)에는 사용자가 직접 구상한 아이디어 구현을, 기능 비교 카테고리(`/front-feature/*`)에는 실행 결과와 코드를 나란히 비교하는 페이지를 모읍니다.
- 무한스크롤과 그 구현 해설은 실험실에 둡니다. React·Next.js·라이브러리·SSR 구현 비교는 기능 비교 하위에 둡니다. SSR 구현의 상세 URL(`/ssr-lab/*`)은 유지하고 기능 비교로 분류합니다.
- 성능 측정(`/performance`)은 측정 조건·수치·저장된 결과를 다룹니다. 실험실·기능 비교와 구분하며, 홈·검색·카탈로그에서도 같은 분류를 유지합니다.
- 실제 실행 가능한 페이지, 준비 중인 기능, 화면 시안을 구분합니다.
- 설치 여부는 `package.json`과 실제 컴포넌트에서 확인합니다. shadcn/ui 등 도입하지 않은 라이브러리를 전제로 설계하지 않습니다.

## UI 실험 카드와 선택 설문
- 일반 UI 실험과 UI 선호도 설문의 개별 선택지 박스는 `app/components/ExperimentBox.tsx`를 사용합니다. 카드 외곽·제목·선택 컨트롤·sticky·축소 모션을 페이지마다 복제하지 않습니다.
- 데모 본문은 `children`으로 전달합니다. 박스에 표 데이터, 설문 상태, 의견 입력, 로그인·저장 로직을 넣지 않습니다. 페이지별 CSS는 카드 배치·너비와 본문을 담당하고, 박스·제목 스타일은 `app/components/experiment-box.module.css`에서 관리합니다.
- 선택 설문의 전체 흐름은 `app/components/Survey.tsx`를 사용합니다. `selection={{ type: "radio" }}` 또는 `selection={{ type: "checkbox", minSelections: 2, maxSelections: 3 }}`로 구성합니다. Checkbox의 최소 개수 기본값은 1입니다. 선택 상태는 `SurveyDraft`의 `optionIds`와 `reason`으로 전달하며, 선택지 ID는 순서가 바뀌어도 유지합니다.
- `Survey`가 Base UI `RadioGroup`·`CheckboxGroup`, 최소·최대 개수 안내, 하단 고정 완료 버튼, 사유 모달을 담당합니다. 선택한 항목이 있으면 Radio·Checkbox 모두 완료 버튼을 표시합니다. Radio는 선택 즉시 모달을 열고, 닫은 뒤에도 완료 버튼으로 다시 열 수 있습니다. Checkbox는 최소 개수를 채운 뒤 완료 버튼으로 엽니다. 모달을 닫거나 다시 열 때 초안을 유지하고 모달을 연 컨트롤로 포커스를 돌려주며, 최대 개수에서는 선택되지 않은 컨트롤만 비활성화합니다. 실제 로그인·저장 연결 전에는 미리보기임을 표시합니다.
- `ExperimentBox`의 선택 기능은 `Survey`가 구성합니다. 선택 기능이 없는 일반 UI에서는 `selection`을 생략하고, 본문 조작이 선택을 발생시키지 않도록 선택 영역은 제목에만 둡니다. 설문별 페이지에는 질문·선택 규칙·데모 본문과 배치만 정의합니다.
- 실제 설문 제출은 `useSurveySubmission`과 `app/lib/survey-client.ts`를 재사용합니다. Google PKCE 로그인 후 초안을 복원하고 `submit_survey_response` RPC로 저장합니다. 공개 키만 브라우저에서 사용하고 사용자 ID는 DB의 `auth.uid()`로 결정합니다. 로그인 실패·취소·저장 오류에서 선택과 사유를 지우지 않습니다. 설정과 운영 조건은 `docs/surveys.md`를 참고합니다.
- 박스 크기 조절은 `ExperimentBox`의 `resize` 옵션을 사용하며, 설문에서는 `Survey.optionResize`로 전달합니다. PC에서는 네 변·네 모서리로 너비와 높이를 조절하고 내부 데모도 남은 높이를 채웁니다. 초기화·키보드 조절을 제공하며 모바일에서는 화면 너비와 기존 높이를 따릅니다. 손잡이는 선택용 제목 밖에 두고, 크기는 설문 응답과 분리된 UI 상태로 관리합니다. 공통 기본 너비가 바뀌면 개별 너비만 초기화하고 높이는 유지합니다.
- `sticky`는 `always`, `mobile`, `none` 중에서 지정합니다(기본값 `always`). 제목 수준은 페이지 구조에 맞게 `headingLevel={2}` 또는 `headingLevel={3}`으로 지정합니다. 일반 UI와 설문을 함께 수정할 때 PC·모바일에서 고정/해제, 축소 중 본문 위치 유지, 라디오 선택과 본문 조작을 확인합니다.

## 기능 비교
- 새 비교는 `skills/front-feature-comparison-workflow/SKILL.md`와 기존 `ComparisonTemplate`을 사용합니다.
- 서버 페이지에서 실제 데모 소스를 읽고, 클라이언트 페이지에서 토픽·조작·좌우 데모를 연결합니다.
- `[cmp:<key>:start]` / `[cmp:<key>:end]` 앵커를 우선하며 파싱 실패 시 fallback 줄을 유지합니다.
- 설명은 최소 3개 토픽으로 차이와 실질적 영향을 짧게 씁니다. 카탈로그는 `since`, `status`, `href`를 함께 관리합니다.
- 실행/코드 보기 전환 시 해당 화면에 의미 있는 조작만 표시합니다. 기존 코드 비교 컴포넌트는 재사용을 우선하고 요청 범위 밖의 변경은 하지 않습니다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
