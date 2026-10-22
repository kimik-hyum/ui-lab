# 캐시와 재요청

같은 API를 캐시 없는 수동 `fetch`와 설치된 TanStack Query로 읽습니다. 라이브러리의 속도 순위가 아니라 **다시 열 때의 대기·재사용·상태 관리**를 비교합니다.

- 메뉴: 기능 비교 → 라이브러리 → 캐시와 재요청
- 원본: `/front-feature/libraries/cache`
- 공통 조건: 프로젝트 A/B와 오류 응답, `/api/cache-demo`의 고정 700ms 지연, HTTP 캐시 없음
- 공통 동작: 항목 변경, 열기·닫기, 닫힌 상태에서 초기화. 진행 중 요청에는 양쪽 모두 AbortSignal을 전달합니다.

수동 조회는 열 때마다 새로 요청합니다. Query는 항목별 queryKey로 성공 결과를 저장하며 `staleTime: 60_000`, `gcTime: 300_000`을 사용합니다. 성공 후 60초 이내 다시 열면 요청 없이 재사용합니다. 시간이 지나면 캐시를 보여주면서 다시 조회하며, 60초 경과 자체가 자동 요청을 일으키지는 않습니다. 사용하지 않는 캐시의 5분 보관은 마지막 observer가 사라진 뒤부터입니다.

자동 재시도·창 포커스·재연결에 의한 재조회는 끕니다. 오류 응답을 닫았다 다시 여는 것은 새로운 조회이므로 다시 요청합니다. QueryClient는 페이지 인스턴스에 속하고, 페이지 이동·새로고침으로 초기화됩니다. 코드/UI 전환은 데모 자식만 재마운트하므로 수동 조회는 다시 요청하고 Query 캐시는 유지됩니다.

표시하는 **요청 시도**는 공통 fetch 함수를 호출한 횟수이며, 취소도 포함합니다. 서버 도착·처리·성공 응답 횟수나 성능 점수가 아닙니다. 브라우저에서 요청을 취소해도 서버의 고정 지연 작업까지 취소되었다고 판단하지 않습니다.

실행 확인: A를 열고 기다린 뒤 닫았다 다시 열어 대기 화면과 요청 시도를 비교합니다. B를 거쳐 A로 돌아와 키별 재사용을 확인하고, 오류 응답·빠른 닫기·초기화도 확인합니다. 60초가 지난 A를 다시 열면 Query는 이전 결과와 재조회 상태를 함께 보여야 합니다. 실행 중 API 확인은 `UI_LAB_BASE_URL=http://127.0.0.1:3003 node --test scripts/cache-comparison.test.mjs`로 수행합니다.

공식 문서: [캐시 기본 동작](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults), [Query Keys](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys), [요청 취소](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation), [QueryClient 인스턴스](https://tanstack.com/query/v5/docs/framework/react/guides/ssr).
