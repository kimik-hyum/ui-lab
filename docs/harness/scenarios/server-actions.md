# Server Actions와 JSON API

- 경로: `/front-feature/nextjs/server-actions`
- 왼쪽: `onSubmit` → `fetch` JSON POST → Route Handler.
- 오른쪽: `form action` → `useActionState`의 클라이언트 래퍼 → 실제 `'use server'` 함수.
- 양쪽 모두 같은 `server-only` 함수로 이름을 정리·검증하고 `node:crypto` 확인번호를 반환합니다. 서버가 붙인 진입점도 결과에 표시합니다.

공백을 섞은 이름으로 정규화를 확인하고, 한 글자를 제출해 입력 보존을 확인합니다. 오류 후 수정하거나 다시 제출할 수 있으며, 처리 중에는 입력·중복 제출을 막고 성공 후 입력을 비웁니다. 전송 실패는 검증 오류와 구별합니다.

800ms는 대기 상태를 보기 위한 서버 인공지연입니다. 성능·저장 속도를 측정하지 않으며, 영구 저장·인증·공유 데이터 변경은 없습니다. 실제 서비스의 인증·인가 구현 예제도 아닙니다.

코드 전환과 초기화는 폼을 제거합니다. API는 브라우저 수신을 중단하지만 서버 처리 종료를 보장하지 않습니다. Server Action에는 클라이언트 취소를 연결하지 않으며 이미 시작한 서버 처리가 계속될 수 있습니다. 클라이언트 래퍼를 사용하므로 JavaScript 없이 제출되는 예제로 설명하지 않습니다.

구현 근거: [Next.js 폼과 Server Actions](https://nextjs.org/docs/app/guides/forms), [Route Handler](https://nextjs.org/docs/app/api-reference/file-conventions/route), [React useActionState](https://react.dev/reference/react/useActionState).
