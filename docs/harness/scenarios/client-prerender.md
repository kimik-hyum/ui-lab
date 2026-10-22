# Client Component와 첫 HTML

기능 비교 → Next.js → **클라이언트와 첫 HTML**. 같은 `Counter`를 기본 Client Component와 `next/dynamic({ ssr: false })`로 불러온다.

- **서버 HTML만**: 실제 응답 문서를 `sandbox="allow-same-origin"` iframe에 열어 스크립트 실행을 막는다. 왼쪽에는 카운트 0과 버튼이 있고 클릭해도 값은 그대로다. 오른쪽에는 `loading` 대체 표시만 남는다.
- **브라우저 실행**: 같은 URL을 sandbox 없이 새 iframe에 연다. 왼쪽 카운터는 기존 HTML을 hydrate하고, 오른쪽 카운터는 클라이언트에서 새로 렌더링한다. 양쪽 버튼으로 증가를 확인한다.
- 모드 변경·처음부터 보기·코드 화면 복귀는 새 문서를 연다. 카운트는 0으로 초기화하고 선택 모드는 유지한다.

`use client`만으로 SSR이 꺼지지 않는다. `ssr: false`는 Client wrapper에 둔다. Counter에 서버 전용 `disabled`나 마운트 감지용 Effect를 넣지 않아 스크립트 실행 여부 자체를 관찰한다. DOM 표시 확인은 hydration 완료나 이벤트 연결의 증명이 아니다.

문서는 `force-dynamic`으로 요청마다 서버에서 만든다. 빌드 시 정적 생성·첫 청크 도착 시간·번들 크기·성능 점수를 비교하지 않는다. 스크립트 차단은 관찰 조건이며 다운로드 차단이나 보안 격리를 주장하지 않는다.

## 실행 계약

`/preview-embed/features/nextjs/client-prerender/run/{prerender|client-only}?run=7&attempt=0`

- main: `data-client-prerender="v1"`, `data-render-kind`, `data-run`
- 카운터: `data-counter="v1"`, `data-counter-value`, `data-counter-increment`
- 대체 표시: `data-counter-placeholder="v1"`
- 서버 문서 마커: `data-client-prerender-ready="v1"` — 카운터 hydration과 별개다.

iframe은 `load`만으로 성공 처리하지 않는다. 문서·조건·DOM을 검사하고 브라우저 모드의 지연 로딩은 MutationObserver로 기다린다. 15초 안에 확인되지 않거나 예상 문서가 아니면 재시도를 제공한다. 재시도와 화면 이동에서는 이전 관찰자·타이머를 정리한다.

## 검증

`node --test scripts/client-prerender.test.mjs`는 조건 정규화·동일 카운터 사용·세 토픽 앵커와 fallback을 검사한다. 서버 검사는 별도 production 실행에서만 활성화한다.

```sh
UI_LAB_CLIENT_PRERENDER_BASE_URL=http://127.0.0.1:3003 node --test scripts/client-prerender.test.mjs
```

HTTP 검사는 script/style/주석을 제외한 실제 main 안의 버튼·0·대체 표시를 확인한다. 기본 실행에서는 서버 검사를 명시적으로 건너뛴다. 브라우저에서는 HTML 모드 클릭/Enter 후 0 유지, 브라우저 모드 양쪽 증가, 모드 변경 후 0, 지연 chunk·잘못된 문서의 오류/재시도와 모바일 폭을 별도로 확인한다.

근거: [Next.js SSR 생략](https://nextjs.org/docs/app/guides/lazy-loading#skipping-ssr), [Client Component 첫 로드](https://nextjs.org/docs/app/getting-started/server-and-client-components), [MDN iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox).
