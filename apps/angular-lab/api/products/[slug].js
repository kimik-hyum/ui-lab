const { createClient } = require('@supabase/supabase-js');

function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL 또는 SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url || '', 'http://127.0.0.1');
    const pathSegments = requestUrl.pathname.split('/').filter(Boolean);
    const slugFromPath = pathSegments[pathSegments.length - 1];
    const slug =
      typeof req.query.slug === 'string' && req.query.slug.length > 0
        ? req.query.slug
        : slugFromPath;

    if (typeof slug !== 'string' || !slug) {
      return res.status(400).json({ message: '유효한 slug가 필요합니다.' });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('products')
      .select(
        'id, slug, name, brand, price, currency, description, image_url, image_width, image_height, stock, rating, created_at'
      )
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
      }

      return res.status(500).json({
        message: '상품 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }

    return res.status(200).json({
      product: data,
      fetchedAt: new Date().toISOString(),
      source: 'angular-vercel-api'
    });
  } catch (error) {
    return res.status(500).json({
      message: '서버 설정 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'unknown'
    });
  }
};
