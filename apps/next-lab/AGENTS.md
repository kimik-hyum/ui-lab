# Next.js 실험 앱

공통 비교 조건은 상위 `apps/AGENTS.md`를 따릅니다.

## 파일 배치
- 시나리오는 `app/scenarios/{scenario-id}/page.tsx`에서 시작합니다.
- 필요한 경우에만 `_components/`, `_lib/`, `_actions/`, `loading.tsx`, `error.tsx`를 추가합니다.
- `page.tsx`는 params/search params 해석, 초기 데이터 로딩, 화면 조합을 담당합니다.
- API가 비교 대상이면 `app/api/{scenario-id}/route.ts`에 명시적으로 둡니다.

## 서버와 클라이언트
- Server Component를 기본으로 합니다. 브라우저 API·이벤트·React 상태·Query hook이 필요한 컴포넌트에만 `'use client'`를 둡니다.
- SSR 데이터는 서버 helper를 직접 호출합니다. 자기 앱의 Route Handler를 다시 fetch하는 비용은 API 비교가 목적일 때만 넣습니다.
- 서버 전용 helper를 Client Component에 import하지 않습니다. 전달 props는 직렬화 가능해야 합니다.
- 라우팅은 `next/link`, 이미지 최적화는 비교 조건을 흐리지 않는 경우 `next/image`를 우선합니다.

## 상태와 갱신
- 기본 `QueryProvider`는 준비되어 있습니다. 서버 prefetch가 필요한 시나리오는 query key·dehydrate·`HydrationBoundary`를 명시합니다.
- 폼과 Server Action 비교는 Server Action을, 클라이언트 캐시 비교는 Route Handler와 Query mutation 조합을 검토합니다.
- 갱신 후 `revalidatePath`, query invalidation, rollback 중 어떤 동기화가 일어나는지 드러냅니다.
- `loading.tsx`·`Suspense`의 셸 전송과 핵심 콘텐츠 도착을 구분합니다. blocking 비교라면 핵심 데이터를 기다린 뒤 렌더링하는 조건을 맞춥니다.
