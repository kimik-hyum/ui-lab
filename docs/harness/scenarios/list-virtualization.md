# 전체 목록과 가상 목록

같은 작업 목록을 React `map`과 설치된 `react-virtuoso`로 표시합니다. 실험실의 무한 스크롤과 달리 데이터 추가 요청 없이 **이미 준비된 목록의 렌더 범위**만 비교합니다.

- 메뉴: 기능 비교 → 라이브러리 → 목록 가상화
- 원본: `/front-feature/libraries/virtual-list`
- 공통 조건: 결정적 데이터 100 / 1,000 / 10,000개, 기본 1,000개, 행 48px, 스크롤 영역 320px
- 공통 동작: 처음·중간·끝 이동. 코드/UI 전환 시 각 목록의 스크롤 위치 유지. 개수를 바꾸면 양쪽 초기화.

왼쪽은 전체 데이터를 DOM으로 만듭니다. 오른쪽은 Virtuoso가 필요한 범위의 행만 유지합니다. 숫자는 각 목록의 실제 `[data-list-row]` 요소를 세며, 범위에는 화면 밖에 남겨둔 행도 포함합니다. 정확히 보이는 행 수와 같다고 해석하지 않습니다.

관찰기는 별도 컴포넌트에서 DOM 변경을 묶어 읽습니다. 스크롤할 때 부모 상태를 갱신해 전체 map을 다시 실행하지 않습니다. 그래도 DOM 조회에는 비용이 있으므로 FPS·메모리·렌더링 시간·SSR 성능의 벤치마크가 아닙니다. 데이터 생성·행 UI·집계 코드는 양쪽이 공유합니다.

코드 비교는 실제 `MapListDemo.tsx`와 `VirtuosoListDemo.tsx`를 읽습니다. 렌더 범위·고정 크기·이동 API의 세 앵커를 하이라이트합니다. 고정 높이가 바뀌는 콘텐츠에는 이 예제의 `fixedItemHeight`를 그대로 적용할 수 없습니다. 가상 목록의 화면 밖 항목은 DOM에 없으므로 문서 전체 찾기·인쇄 같은 기능은 별도 고려가 필요합니다.

브라우저 확인: 10,000개를 선택해 끝으로 이동한 뒤 마지막 작업·실제 DOM 수를 확인합니다. 코드/UI를 왕복하고 100개로 바꾸어 위치 복원과 초기화를 확인합니다. 목록은 키보드로 포커스해 스크롤할 수 있으며 개별 행은 Tab 정지점을 만들지 않습니다.

공식 문서: [Virtuoso API](https://virtuoso.dev/react-virtuoso/api-reference/virtuoso/), [인덱스로 이동](https://virtuoso.dev/react-virtuoso/virtuoso/scroll-to-index/), [렌더 범위 콜백](https://virtuoso.dev/react-virtuoso/virtuoso/range-change-callback/).
