# 대시보드 SSR: 로딩 순서와 표시 순서

상품 상세와 별개로, 두 독립된 데이터가 필요한 작은 팀 대시보드와 고정 아티클을 사용합니다. 외부 API·DB 없이 같은 fixture를 읽습니다. 아래 실험은 **Next.js 내의 구현 방식 비교**이며 프레임워크 순위를 만들지 않습니다.

## 순차·동시 데이터 로딩

- 비교 화면: `/ssr-lab/data-loading`
- 데모 메뉴: 기능 비교 → 프레임워크 비교 → 순차·동시 데이터 로딩
- 실제 서버 경로: `/preview-embed/ssr/data-loading/{sequential|parallel}?delay=800`
- 지연: 각 작업에 400 / 800 / 1200ms. 허용하지 않은 값은 800ms.
- 같은 결과를 두 번의 `await`로 읽거나, `Promise.all`로 함께 시작합니다.
- 둘 다 데이터가 준비된 뒤 콘텐츠를 보내는 일괄 SSR입니다. 병렬화와 스트리밍을 구분합니다.
- 작업 막대는 서버 데이터 계층에서 수집한 시작·종료 시각입니다. 네트워크·화면 표시 시간은 포함하지 않습니다.

첫 작업의 결과가 다음 요청에 필요한 경우에는 순차 실행이 맞습니다. 이 fixture는 두 데이터가 독립적이므로 병렬 실행이 가능합니다.

코드 비교에는 좌우 실행 파일과 공통 `server/data.ts`, `components/DataLoadingResult.tsx`를 파일명 구분과 함께 표시합니다. 요청 순서뿐 아니라 `performance.now()`로 구간을 기록하는 곳, 인공지연을 넣는 곳, 숫자와 막대를 그리는 곳까지 확인할 수 있습니다.

각 응답의 막대는 0ms부터 표시된 상한까지의 축을 사용합니다. 기본 상한은 선택한 작업 지연의 두 배이며 실제 종료 시각이 이를 넘으면 확장됩니다. 패널별 상한이 다를 수 있으므로 막대 길이만으로 속도를 판단하지 않고, 시작·종료 숫자와 작업의 겹침을 함께 봅니다.

## 일괄 SSR·Suspense 스트리밍

- 비교 화면: `/front-feature/nextjs/streaming`
- 데모 메뉴: 기능 비교 → Next.js → 일괄 SSR과 스트리밍
- 실제 서버 경로: `/preview-embed/features/nextjs/streaming/run/{blocking|streaming}?delay=1000`
- 요약 / 활동의 지연: 500 / 1200ms, 1000 / 2200ms, 2000 / 4200ms.
- 양쪽 모두 같은 두 작업을 동시에 시작합니다. 일괄 SSR은 둘 다 기다리고, 스트리밍은 제목·fallback을 먼저 보낸 뒤 각 결과를 보냅니다.
- `data-stream-stage="shell|summary|activity"`로 실제 HTML 응답의 도착 순서를 확인할 수 있습니다.

프록시 버퍼링이나 크롤러 처리에 따라 전송 방식이 달라질 수 있습니다. 셸의 첫 바이트를 핵심 콘텐츠 도착 시간으로 해석하지 않습니다. iframe을 동시에 띄우는 UI는 관찰 도구이며 정밀 벤치마크가 아닙니다.

## 아티클: 브라우저 요청·서버 데이터 로딩

- 비교 화면: `/front-feature/nextjs/rsc-vs-csc`
- 데모 메뉴: 기능 비교 → Next.js → 서버·클라이언트 렌더링
- 왼쪽: `useEffect`에서 `/api/rsc-demo?delay=1000`을 요청하고 JSON으로 본문을 표시합니다.
- 오른쪽: `/preview-embed/features/nextjs/rsc-vs-csc/run/rsc?delay=1000`을 새 문서로 요청합니다. async Server Component가 데이터를 기다린 뒤 본문을 HTML에 포함하는 일괄 SSR입니다.
- 양쪽은 동일한 서버 데이터 함수와 아티클을 사용합니다. 지연은 0 / 500 / 1000 / 2000 / 3000ms이며, 허용하지 않은 값은 1000ms입니다.
- 실제 문서의 `data-article-source="server"`와 `data-article-id`로 JavaScript 실행 전 HTML에 본문이 있는지 확인합니다. `article=missing`은 API·서버 문서 모두 404로 응답합니다.

이 비교는 데이터가 준비되는 위치를 보여줍니다. 왼쪽은 API 요청, 오른쪽은 문서 요청이므로 로딩 시간을 성능 순위로 비교하지 않습니다. 완료 응답 수는 성공한 API 응답만 셉니다. 번들 크기와 렌더링 시간은 측정하지 않습니다. Client Component도 최초 요청에서는 서버에서 미리 렌더링될 수 있으며, 왼쪽처럼 `useEffect`로 본문을 가져오는 구현과 구분합니다.

브라우저 요청은 fetch 시작부터 JSON 수신까지 15초로 제한합니다. 시간 초과는 재실행 안내로 표시하고, 조건 변경·화면 이동에 따른 취소는 오류로 표시하지 않습니다. 늦게 끝난 이전 요청은 화면과 완료 횟수를 바꾸지 않습니다. 코드 비교에는 실제 `request-article.ts`도 포함합니다. 코드 보기에서 UI 보기로 돌아오면 양쪽 요청을 새로 시작하고 완료 응답 수는 0부터 다시 셉니다.

오른쪽 문서도 바깥 관찰 화면에서 15초까지만 기다립니다. `load` 발생만으로 성공 처리하지 않고 현재 URL의 경로·지연·회차·재시도 조건과 실제 서버 아티클 본문을 확인합니다. 시간 초과나 예상하지 않은 문서는 iframe을 제거하고 **오른쪽만 다시 불러오기**를 제공합니다. 재시도는 같은 지연 조건의 새 문서를 열며 왼쪽 결과와 완료 횟수는 보존합니다. 화면 이동·조건 변경·재시도 때 이전 이벤트와 타이머를 정리해 늦은 문서가 현재 상태를 덮지 않게 합니다. 이 제한은 관찰 대기를 끝내며 서버 작업 취소나 렌더링 시간 측정을 의미하지 않습니다. 코드 비교의 오른쪽 소스는 관찰 iframe이 아닌 실제 `RscArticleViewer`입니다.

세 서버 실험의 오류 화면은 Next.js `retry()`로 서버 재요청과 복구를 시도합니다. 설치된 Next.js 16.4.2의 `error-boundary` 구현에서도 `retry()`가 `refresh()`와 상태 초기화를 함께 수행함을 확인했습니다. `reset()`만 호출하면 내용을 다시 요청하지 않으므로 일시적인 서버 오류 재시도에는 사용하지 않습니다.

## 재현

lab-shell 프로덕션 서버를 실행한 뒤 다음 명령으로 서버 응답을 검사합니다.

```sh
UI_LAB_BASE_URL=http://127.0.0.1:3003 node --test scripts/ssr-experiments.test.mjs
```

아티클 요청의 시간 제한·취소 경쟁은 앱 서버 없이 `node --test scripts/article-request.test.mjs`로 확인합니다. 임시 로컬 HTTP 서버에서 헤더 또는 JSON 본문이 멈추는 경우도 포함합니다.

코드 비교는 기존 `ComparisonTemplate`을 사용하며, 앵커와 토픽을 통해 대응 줄을 확인합니다. 데이터·시간 계측·표현 컴포넌트를 분리해 비교 대상 코드의 차이가 드러나도록 구성했습니다.

공식 근거: [병렬 데이터 로딩](https://nextjs.org/docs/app/getting-started/fetching-data#parallel-data-fetching), [Next.js 스트리밍](https://nextjs.org/docs/app/guides/streaming), [React Suspense](https://react.dev/reference/react/Suspense), [서버·클라이언트 컴포넌트](https://nextjs.org/docs/app/getting-started/server-and-client-components), [오류 경계의 retry와 reset](https://nextjs.org/docs/app/api-reference/file-conventions/error#retry).
