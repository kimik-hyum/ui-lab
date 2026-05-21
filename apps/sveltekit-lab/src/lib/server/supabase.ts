import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { ProductRow } from '@ui-lab/api-types';

export type { ProductRow };

export function getSupabaseServerClient() {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL 또는 SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
