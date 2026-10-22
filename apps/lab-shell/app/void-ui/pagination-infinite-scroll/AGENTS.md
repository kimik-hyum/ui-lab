# 무한스크롤 작업

- 변경 전에 이 폴더의 `useHybridInfinite-rules.mdc`를 읽습니다. URL 페이지 복원, 양방향 로딩, 가상화 adapter의 계약을 유지합니다.
- 로딩·스크롤 로직을 바꾸면 브라우저에서 다음을 확인합니다.
  - 1보다 큰 페이지에 직접 진입하거나 새로고침해 해당 페이지에서 시작합니다.
  - 첫 이전 로딩은 버튼으로 시작하고, 이후 위로 스크롤하면 이전 페이지를 추가합니다. prepend 후 읽던 위치를 유지합니다.
  - 다음 페이지를 추가한 뒤 읽던 위치가 하단에 붙지 않습니다. 입력을 멈추면 추가 로딩이 연쇄적으로 계속되지 않습니다.
  - URL 이동·뒤로가기·모바일 스크롤 중 변경에 영향받는 경로를 확인합니다.
- 관련 기존 테스트는 `scripts/page-navigation-events.test.mjs`, `scripts/infinite-frame.test.mjs`, `scripts/virtuoso-adapter.test.mjs`입니다. 이 테스트의 통과만으로 실제 스크롤 검증을 대신하지 않습니다.
