# 서버 함수 결과 재사용

- 메뉴: 기능 비교 → Next.js → 요청 안에서 재사용. 본문 제목은 같은 서버 작업의 재사용입니다.
- 비교: `/front-feature/nextjs/request-cache`.
- 실제 RSC 문서: `/preview-embed/features/nextjs/request-cache/run/{direct|cached}?pattern={same|mixed}`.

세 카드가 같은 로컬 서버 함수를 호출합니다. 왼쪽은 원본 함수를, 오른쪽은 모듈에서 한 번 생성한 `cache(readTeam)`을 Server Component 안에서 호출합니다. 양쪽이 같은 문자열 팀 ID를 전달합니다.

`readTeam` 본문에서 실제 UUID를 생성합니다. 화면 숫자는 반환된 카드 3개에서 중복을 제거한 **서로 다른 실행 ID 개수**입니다. 전체 서버 작업량·처리 시간·성능 점수가 아닙니다. DB·외부 API·인공지연·공유 전역 카운터는 없습니다.

- 모두 같은 팀: 왼쪽은 다른 ID 3개, 오른쪽은 같은 ID를 공유합니다.
- 한 카드만 다른 팀: 오른쪽의 알파 팀 두 카드는 공유하고 베타 팀은 다른 ID를 받습니다.
- 새 응답 요청: 서버 요청 범위의 캐시는 초기화되어 이전 ID가 다시 사용되지 않습니다.
- 코드 보기에서 돌아오면 선택은 유지되지만 새 문서를 요청합니다. iframe은 현재 조건의 결과·완료 마커를 확인하며 15초 대기 또는 잘못된 문서에는 재시도를 제공합니다.

함수를 감싼 위치, 인자, 실제 ID 생성 코드를 세 토픽으로 비교합니다. `cache()`는 브라우저 캐시나 요청을 넘어 유지되는 캐시가 아닙니다. [React 공식 문서](https://react.dev/reference/react/cache).

`node --test scripts/request-cache.test.mjs`는 조건·소스 연결만 검사하고 실행 서버 검사는 건너뜁니다. production RSC 검증은 실행 중인 서버를 명시해 수행합니다. 이 명령은 서버를 시작하거나 성능 기록을 저장하지 않습니다.

```sh
UI_LAB_REQUEST_CACHE_BASE_URL=http://127.0.0.1:3003 node --test scripts/request-cache.test.mjs
```
