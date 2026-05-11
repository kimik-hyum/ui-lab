import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  description: string;
  image_url: string;
  image_width: number;
  image_height: number;
  stock: number;
  rating: number;
  created_at: string;
};

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
