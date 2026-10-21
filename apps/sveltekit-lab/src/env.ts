import { defineEnvVars } from '@sveltejs/kit/env';

// 서버 전용이며 실행 시점에 읽습니다. 값은 저장소에 기록하지 않습니다.
export const variables = defineEnvVars({
  SUPABASE_URL: {},
  SUPABASE_ANON_KEY: {},
});
