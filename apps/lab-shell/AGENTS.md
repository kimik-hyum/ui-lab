# UI-LAB 화면과 기능 비교

## Next.js 구현
- App Router의 서버 컴포넌트를 기본으로 하고, 브라우저 API·이벤트·상태가 필요한 컴포넌트에만 `'use client'`를 둡니다.
- 앱 라우팅은 `next/link`, 이미지 최적화는 비교 목적에 맞는 경우 `next/image`를 사용합니다.
- React 화면은 기존 Tailwind·공통 컴포넌트를 재사용합니다. SyntaxHighlighter 스타일은 필요한 것만 import합니다.

## 화면 기준
- 현재 공통 화면은 `public/previews/responsive-layout/`입니다. 색상·간격·카드 기준은 이 폴더의 `style.css`와 기존 페이지에서 확인합니다.
- PC에서는 넓은 작업 공간을 활용하고, 태블릿·모바일에서는 내용 잘림과 가로 넘침 없이 재배치합니다.
- 실험실은 무한스크롤, 기능 비교는 React·Next.js·라이브러리·프레임워크 비교를 담당합니다. 상세는 같은 카테고리의 하위 페이지로 연결합니다.
- 실제 실행 가능한 페이지, 준비 중인 기능, 화면 시안을 구분합니다.
- 설치 여부는 `package.json`과 실제 컴포넌트에서 확인합니다. shadcn/ui 등 도입하지 않은 라이브러리를 전제로 설계하지 않습니다.

## 기능 비교
- 새 비교는 `skills/front-feature-comparison-workflow/SKILL.md`와 기존 `ComparisonTemplate`을 사용합니다.
- 서버 페이지에서 실제 데모 소스를 읽고, 클라이언트 페이지에서 토픽·조작·좌우 데모를 연결합니다.
- `[cmp:<key>:start]` / `[cmp:<key>:end]` 앵커를 우선하며 파싱 실패 시 fallback 줄을 유지합니다.
- 설명은 최소 3개 토픽으로 차이와 실질적 영향을 짧게 씁니다. 카탈로그는 `since`, `status`, `href`를 함께 관리합니다.
- 실행/코드 보기 전환 시 해당 화면에 의미 있는 조작만 표시합니다. 기존 코드 비교 컴포넌트는 재사용을 우선하고 요청 범위 밖의 변경은 하지 않습니다.
