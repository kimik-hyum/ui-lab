# Activity: 상태 보존과 Effect 정리

- 원본: `/front-feature/react/activity`
- 디자인 데모: `#/features/react/activity`
- 비교: CSS `display: none` / React `<Activity mode="hidden">`

같은 메모 입력과 500ms interval을 사용합니다. 양쪽에 메모를 적은 뒤 패널을 숨기면 CSS 쪽은 interval을 유지하고, Activity 쪽은 Effect의 정리 함수를 실행해 interval을 해제합니다. 다시 표시하면 메모는 양쪽 모두 유지되고 Activity의 Effect가 새로 시작됩니다.

화면의 세 카운터는 Effect 시작·정리·interval 콜백의 실제 호출 횟수입니다. 이전의 CPU 반복 계산과 환산값은 제거했습니다. 렌더 횟수, CPU 작업량, 프레임워크 성능을 측정하지 않습니다. 숨겨진 Activity도 props 변경에 반응해 낮은 우선순위로 렌더링할 수 있습니다.

두 경계 안에서는 같은 `ActivityProbe`를 실행하고, 카운터는 경계 밖에서 관리합니다. 코드 화면에는 각 경계의 실제 소스와 공통 probe·카운터 reducer·타입을 함께 읽어 표시합니다. `hidden-strategy`, `background-effects`, `state-preservation` 앵커가 설명과 하이라이트를 연결합니다.

`양쪽 처음부터`는 메모와 관찰 기록을 새로 시작합니다. 공통 비교 화면의 UI/코드 전환은 데모를 제거했다가 다시 마운트하므로 역시 새 관찰이 시작됩니다. 숨김·표시와 제거·재마운트의 차이를 구분해야 합니다. 개발 모드의 Strict Mode는 Effect를 추가로 실행하므로 조작 전후의 증가폭을 비교합니다.

근거: [React Activity 공식 문서](https://react.dev/reference/react/Activity).
