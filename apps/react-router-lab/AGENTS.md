# React Router 실험 앱

Framework Mode를 사용하며 공통 비교 조건은 상위 `apps/AGENTS.md`를 따릅니다.

## 파일 배치
- `/scenarios/{scenario-id}`를 `app/routes.ts`에 등록합니다.
- `app/routes/scenarios.{scenario-id}.tsx`에는 loader·action·meta·ErrorBoundary·route component를 둡니다.
- 실제 UI와 helper는 `app/scenarios/{scenario-id}/components/`, `lib/`에 모읍니다.
- resource route가 필요하면 `app/routes/api.{scenario-id}.tsx`를 만들고 라우트에 연결합니다.

## 데이터와 상태
- 초기 데이터와 route 조건은 `loader`, 변경과 redirect/revalidation은 `action`을 사용합니다.
- 서버 데이터·환경변수 접근은 `.server.ts`에 두고 클라이언트 모듈에서 import하지 않습니다.
- 순수 SSR 비교에서는 loader가 서버 helper를 직접 호출합니다. `clientLoader`는 클라이언트 로딩이 목적일 때 사용합니다.
- URL 상태는 search params로 유지합니다. navigation pending은 `useNavigation`, 이동 없는 폼·요청 상태는 `useFetcher`를 우선합니다.
- 페이지 이동을 동반하는 폼은 `<Form>`을 사용합니다. action 이후 loader revalidation과 Query invalidation의 책임을 구분합니다.
- 기존 `QueryProvider`는 클라이언트 중심입니다. 서버 캐시 준비가 필요하면 loader data·initial data·hydration 경계를 별도로 설계합니다.
- streaming 비교에서는 loader 반환 객체에 미해결 Promise를 담고 `Suspense`/`Await`로 처리하는 경계를 명시합니다. 셸 TTFB와 content-ready를 구분합니다.

## Import와 검사
- 컴포넌트/API는 `react-router`, route 설정 helper는 `@react-router/dev/routes`에서 가져옵니다.
- `app/root.tsx`에는 전역 provider와 문서 shell을 둡니다.
- `yarn workspace react-router-lab lint`는 route typegen과 TypeScript 검사를 함께 실행합니다.
