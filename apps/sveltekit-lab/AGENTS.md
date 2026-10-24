# SvelteKit 실험 앱

공통 비교 조건은 상위 `apps/AGENTS.md`를 따릅니다.

## 현재 설정
- SvelteKit 3 설정과 Vercel adapter는 `vite.config.ts`의 `sveltekit(...)`에 둡니다.
- `#lib/*`는 `package.json`의 `imports`에 정의하며 import에 파일 확장자를 포함합니다.
- `tsconfig.json`은 `$app/tsconfig`를 확장합니다.
- 환경변수는 `src/env.ts`에서 선언하고 서버에서 `$app/env/private`로 읽습니다.

## 파일 배치
- 시나리오는 `src/routes/scenarios/{scenario-id}/`에 둡니다.
- `+page.server.ts`는 서버 데이터·조건 검사를, `+page.svelte`는 받은 data의 표현과 화면 조합을 담당합니다.
- 복잡한 UI는 route-local `_components/`, 브라우저용 helper·타입은 `_lib/`에 둡니다.
- 서버 helper는 `src/lib/server/scenarios/{scenario-id}.ts`, 공용 fixture·타입은 `src/lib/scenarios/{scenario-id}/`에 둡니다.
- API가 필요하면 `src/routes/api/scenarios/{scenario-id}/+server.ts`를 사용합니다.

## 데이터와 갱신
- 비공개 환경변수·DB 접근은 server load/helper에 둡니다. `.svelte`·universal `+page.ts`·Query 모듈에서 `#lib/server`를 import하지 않습니다.
- 순수 SSR 비교에서는 server load가 helper를 직접 호출합니다. 내부 API fetch/inlining을 비교할 때만 endpoint를 경유합니다.
- form action은 `+page.server.ts`의 `actions`, API mutation은 `+server.ts`의 HTTP handler를 사용합니다.
- 기존 `QueryClientProvider`와 load data를 함께 쓰면 각각의 캐시·초기 데이터·무효화 책임을 명시합니다.
- streaming 비교에서는 load가 반환하는 미해결 Promise와 `{#await}` 경계를 명시하고 셸 TTFB와 content-ready를 구분합니다.
- navigation은 일반 `<a>`를 사용합니다. 실패 화면은 SvelteKit의 error 경계로 처리합니다.
- `yarn workspace sveltekit-lab lint`는 sync와 svelte-check를 실행합니다.
