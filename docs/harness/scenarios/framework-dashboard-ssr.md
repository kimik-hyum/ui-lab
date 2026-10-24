# 네 프레임워크의 대시보드 SSR

Next.js·React Router·SvelteKit·Nuxt가 같은 팀 대시보드를 초기 HTML로 반환하는 과정을 비교합니다. 상품 상세와 달리 외부 DB 없이 `fixtures/dashboard-ssr.json`을 사용합니다.

## 같은 조건

- 앱 경로: `/scenarios/dashboard-ssr?team=alpha&delay=400`
- 팀: `alpha`는 작업 8개·검토 3개·활동 3개, `empty`는 요약 0·활동 없음, `missing`은 HTTP 404입니다.
- 서버 인공지연: `0 / 400 / 800ms`. 생략하거나 다른 값을 넣으면 앱은 400ms로 정규화합니다.
- `0ms`에서는 타이머를 만들지 않습니다. `400 / 800ms`에서는 서버 대기를 마친 뒤 정상·빈 팀·없는 팀을 판별합니다.
- 네 앱 모두 데이터를 기다린 뒤 핵심 콘텐츠를 반환하는 blocking SSR입니다. 별도 streaming 시나리오와 구분합니다.
- 초기 데이터는 Next Server Component, React Router loader, SvelteKit server load, Nuxt `useFetch`와 Nitro handler에서 준비합니다.
- 공통 CSS는 `fixtures/dashboard-ssr.css`입니다. 데이터·표현을 같게 유지하되 각 프레임워크의 데이터 로딩 경계는 드러냅니다.

## 역할별 코드 비교

비교 화면의 `코드에서 볼 범위`에서 서버 진입점·데이터 처리·화면 출력·오류 경계 중 하나를 선택하고 `View Code`를 누릅니다. 서버가 실제 소스를 읽어 기존 코드 비교 컴포넌트에 전달합니다. 각 역할의 파일 경로는 하단에서 확인할 수 있습니다.

하단의 `수정하려면` 버튼은 빈 상태 안내→화면 출력, 지연·빈 팀 처리→데이터 처리, 404 처리→오류 경계로 연결됩니다. 코드 범위와 파일 목록만 바꾸며 현재 관찰 결과는 유지합니다. Nuxt의 오류 범위에는 프로젝트의 404 생성·전달 코드가 포함되며, Nuxt 기본 오류 화면의 내부 구현은 포함하지 않습니다.

- 서버 진입점: Server Component, loader, server load, useFetch의 데이터 전달 경계.
- 데이터 처리: 지연 기본값, 빈 팀 데이터, 없는 팀을 반환하는 순서. Nuxt는 Nitro handler·서버 함수·응답 타입을 함께 표시합니다.
- 화면 출력: props, 요약 목록, 활동과 빈 상태. 안내 문구를 바꿀 파일을 직접 찾을 수 있습니다.
- 오류 경계: 없는 팀의 404 전달, 예외 처리, 현재 구현의 복구 방식. 복구 버튼이 없는 구현도 그대로 보여줍니다.

진입점의 기존 `[cmp:*]` 마커와 나머지 범위의 실제 코드 문장을 기준으로 설명에 해당하는 줄을 연결합니다. 역할별 파일 수는 표시 범위이며 전체 코드량이나 DX 점수가 아닙니다. AI 작업 성공률·수정 횟수는 별도 실행 기록이 생겼을 때 평가합니다.

Next.js 16.4.2의 원본 `error.tsx`는 `retry()`로 서버에 다시 요청해 오류 경계 안의 서버 컴포넌트도 재실행합니다([공식 문서](https://nextjs.org/docs/app/api-reference/file-conventions/error#retry)). React Router는 새로고침을 안내하고, SvelteKit·Nuxt 시나리오에는 별도 복구 버튼이 없습니다. 이 화면에서는 해당 코드만 비교하며 강제 500 시나리오는 추가하지 않습니다.

없는 팀도 네 앱이 같은 서버 대기를 마친 뒤 HTTP 404로 처리합니다. `missing`은 404 처리 확인용이며 정상 `alpha`로 수집하는 반복 리포트에는 포함하지 않습니다.

## 조건 링크

`조건 링크 복사`는 왼쪽·오른쪽 프레임워크, 팀, 지연, 코드 범위를 주소에 담습니다. 공유 화면은 hash 뒤의 query를 사용하고, 직접 비교 페이지는 일반 query를 사용합니다. 새로고침하거나 메뉴 이동 후 뒤로 돌아오면 마지막 조건으로 새 응답을 관찰합니다. 이전 측정값이나 UI·코드 탭의 열림 상태는 저장하지 않습니다.

허용하지 않는 값과 중복 필드는 각 기본값으로 복원합니다. 좌우가 같은 프레임워크이면 오른쪽을 다른 기본값으로 보정합니다. 코드 범위 변경이나 링크 복사는 관찰을 다시 요청하지 않습니다. 클립보드를 사용할 수 없을 때는 직접 선택해 복사할 주소를 표시합니다.

## 공유 화면에서 관찰하는 범위

lab-shell의 `/ssr-lab/framework-dashboard`는 `/api/ssr-observer/{framework}`를 통해 실행 중인 각 앱의 HTML을 읽습니다. `framework`는 `next`, `react-router`, `sveltekit`, `nuxt`만 허용합니다. 관찰 API는 앱과 달리 허용하지 않은 조건이나 중복 query를 HTTP 400으로 거부합니다.

비교 문서 자체가 15초 안에 준비되지 않거나 잘못된 문서가 도착하면 바깥 화면에 `다시 불러오기`를 표시합니다. 재시도는 현재 조건을 유지한 새 iframe으로 시작합니다.

브라우저는 관찰 결과의 JSON 본문까지 최대 15초 기다린 뒤 재시도를 안내합니다. 응답 구조·프레임워크·요청 조건·측정값을 확인하므로 잘못된 결과는 해당 패널의 오류로 처리합니다. 이 제한은 화면의 대기 상태를 끝내기 위한 것이며 서버 응답 측정값에 포함하지 않습니다. 좌우 요청은 각각 종료하고, 조건 변경·메뉴 이동으로 취소한 결과는 표시하지 않습니다.

응답의 main을 추출한 뒤 공통 CSS와 스크립트 실행을 막은 sandbox 문서로 보여줍니다. 원본 앱의 JavaScript·RSC payload·자산 URL은 포함하지 않습니다. 이는 **서버가 반환한 콘텐츠의 복사본**이며 원본 앱의 hydration이나 상호작용을 실행하는 화면이 아닙니다.

`missing` 요청은 관찰 결과의 HTTP 404 카드로 표시합니다. 원본 앱의 오류 경계 UI나 재시도 버튼은 이 관찰 화면에서 실행하지 않습니다. `오류 경계` 코드 범위를 선택해도 팀 조건이나 관찰 요청은 바뀌지 않습니다.

시간은 사용자 브라우저가 아니라 **lab-shell 서버 → 프레임워크 서버**에서 잽니다.

- `responseStartMs`: 응답 헤더 수신.
- `firstByteMs`: 첫 body chunk 수신.
- `contentReadyMs`: 실제 `<p data-dashboard-ready="v1">`의 내용과 닫는 태그를 받은 시각. script·주석 속 문자열은 제외합니다.
- `totalMs`: 본문 수신 완료.
- `htmlBytes`: 읽은 응답 본문 바이트. 압축 전송량이나 JavaScript 번들 크기가 아닙니다.

한 번의 관찰값으로 프레임워크 순위를 정하지 않습니다. 인공지연·현재 머신 상태·동시 요청이 포함되며 화면 표시, hydration, LCP, 상호작용 시간은 측정하지 않습니다. 표시 버전은 관찰 빌드의 설치 패키지 정보입니다. 원격 origin을 지정하면 해당 서버의 배포 버전은 별도 확인해야 합니다.

## 실행과 확인

먼저 네 앱과 lab-shell을 production 빌드 후 실행합니다. 기본 포트는 Next 3001, SvelteKit 3002, lab-shell 3003, Nuxt 3004, React Router 3005입니다. 아래 검사는 실행 중인 서버만 사용하며 서버를 시작하거나 성능 결과를 저장하지 않습니다.

```sh
node --test scripts/ssr-observer.test.mjs
UI_LAB_BASE_URL=http://127.0.0.1:3003 node --test scripts/framework-dashboard.test.mjs
```

첫 검사는 parser·부분 chunk·가짜 마커·응답 크기·취소·query 계약을 확인합니다. 두 번째 검사는 네 앱의 정상·빈 상태·404·지연 정규화와 공개 관찰 API를 확인합니다.

다른 포트나 배포를 확인할 때 `UI_LAB_SSR_NEXT_ORIGIN`, `UI_LAB_SSR_REACT_ROUTER_ORIGIN`, `UI_LAB_SSR_SVELTEKIT_ORIGIN`, `UI_LAB_SSR_NUXT_ORIGIN`에 HTTP(S) origin을 지정합니다. 테스트 프로세스와 lab-shell 서버에 같은 대상을 설정해야 합니다.

반복 측정 기록은 기존 SSR 하네스를 사용합니다. 이 하네스는 자체적으로 앱을 빌드·기동하므로 기본 앱 포트가 비어 있어야 합니다.

```sh
SSR_PATH='/scenarios/dashboard-ssr?team=alpha&delay=400' \
SSR_EXPECT_TEXT='data-dashboard-ready="v1"' \
SSR_RUNS=20 SSR_WARMUP=3 yarn perf:ssr
```

하네스의 content-ready는 지정한 문자열이 처음 등장한 시각이고, 관찰 API는 완료 태그가 닫힌 시각입니다. 숫자를 같은 측정값으로 합치지 않습니다. 자세한 해석은 [성능 측정 방법론](../performance-methodology.md)을 따릅니다.

공유 화면의 리포트에는 관찰 API로 워밍업 3회·기록 20회를 수집한 별도 기록을 연결합니다. 실행 중인 production 서버에서 수집하는 명령과 원본 위치는 [팀 대시보드 SSR 반복 기록](../results/dashboard-ssr.md)을 참고하세요.

측정 출처에는 시나리오·fixture 외에 실제 렌더링에 참여하는 앱 루트, provider/plugin, 전역 CSS, 라우팅·빌드·TypeScript 설정을 기록합니다. 관찰 서버는 API 처리에 적용되는 설정과 관찰 코드를 기록하며 UI 레이아웃은 포함하지 않습니다. 생성된 빌드 파일·환경변수·관련 없는 시나리오 전체를 수집하지는 않으므로 실행 서버와의 배포 일치는 별도로 확인해야 합니다.

`0ms` 타이머 생략 또는 처리 순서가 바뀌면 네 앱을 다시 빌드하고 새 기록을 수집합니다. 기존 결과에서 일정 시간을 빼서 보정하거나 이전 실행과 같은 통계로 합치지 않습니다. 타이머 동작은 앱 서버 없이 `node --test scripts/dashboard-data.test.mjs`로 확인할 수 있습니다.
