import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { join } from 'node:path';
import type { Product } from './app/core/product';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

function getSupabaseServerClient() {
  const supabaseUrl = process.env['SUPABASE_URL'];
  const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'];

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

app.get('/api/products/:slug', async (req, res) => {
  try {
    const slug = req.params['slug'];

    if (!slug) {
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

    return res.json({
      product: data as Product,
      fetchedAt: new Date().toISOString(),
      source: 'angular-api'
    });
  } catch (error) {
    return res.status(500).json({
      message: '서버 설정 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'unknown'
    });
  }
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false
  })
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
