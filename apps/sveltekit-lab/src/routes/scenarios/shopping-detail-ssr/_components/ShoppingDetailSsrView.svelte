<script lang="ts">
  import type { ProductRow } from '@ui-lab/api-types';
  import {
    formatDateTime,
    formatPrice,
    formatRating,
    formatStock
  } from '../_lib/shopping-detail-ssr-format';

  type Props = {
    product: ProductRow;
    requestedSlug: string;
    source: string;
  };

  let { product, requestedSlug, source }: Props = $props();
</script>

<main>
  <article class="surface" aria-labelledby="scenario-title">
    <header class="header">
      <p class="eyebrow">SvelteKit SSR Harness</p>
      <h1 id="scenario-title">Scenario: Shopping Detail SSR</h1>
      <p class="summary">
        +page.server.ts에서 서버 helper를 직접 호출해 상품 상세 데이터를 렌더링합니다.
      </p>
      <dl class="run-meta">
        <div>
          <dt>source</dt>
          <dd>{source}</dd>
        </div>
        <div>
          <dt>slug</dt>
          <dd>{requestedSlug}</dd>
        </div>
      </dl>
    </header>

    <section class="product-grid" aria-label="상품 상세">
      <div class="media-panel">
        <img
          src={product.image_url}
          alt={product.name}
          width={product.image_width}
          height={product.image_height}
        />
      </div>

      <div class="detail-panel">
        <p class="brand">{product.brand}</p>
        <h2>{product.name}</h2>
        <p class="description">{product.description}</p>

        <p class="price">{formatPrice(product.price, product.currency)}</p>

        <dl class="spec-list">
          <div>
            <dt>브랜드</dt>
            <dd>{product.brand}</dd>
          </div>
          <div>
            <dt>가격</dt>
            <dd>{formatPrice(product.price, product.currency)}</dd>
          </div>
          <div>
            <dt>재고</dt>
            <dd>{formatStock(product.stock)}</dd>
          </div>
          <div>
            <dt>평점</dt>
            <dd>{formatRating(product.rating)}</dd>
          </div>
          <div>
            <dt>생성일</dt>
            <dd>{formatDateTime(product.created_at)}</dd>
          </div>
        </dl>
      </div>
    </section>

    <footer>
      <a href="/">홈으로 이동</a>
    </footer>
  </article>
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
  }

  .surface {
    border: 1px solid #d8dee9;
    border-radius: 8px;
    background: #ffffff;
    overflow: hidden;
  }

  .header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .eyebrow {
    margin: 0 0 0.5rem;
    color: #276749;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 0.5rem;
    color: #111827;
    font-size: 2.75rem;
    line-height: 1.05;
  }

  h2 {
    margin-bottom: 0.75rem;
    color: #111827;
    font-size: 2rem;
    line-height: 1.15;
  }

  .summary,
  .description {
    color: #4b5563;
    line-height: 1.65;
  }

  .run-meta,
  .spec-list {
    display: grid;
    gap: 0.75rem;
    margin: 0;
  }

  .run-meta {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    margin-top: 1rem;
  }

  .run-meta div,
  .spec-list div {
    display: grid;
    grid-template-columns: 6rem minmax(0, 1fr);
    gap: 0.75rem;
    align-items: baseline;
  }

  dt {
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 700;
  }

  dd {
    min-width: 0;
    margin: 0;
    color: #111827;
    overflow-wrap: anywhere;
  }

  .product-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .media-panel {
    display: grid;
    place-items: center;
    min-height: 360px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  img {
    width: 100%;
    height: auto;
    border-radius: 8px;
  }

  .detail-panel {
    align-self: center;
  }

  .brand {
    margin-bottom: 0.5rem;
    color: #276749;
    font-weight: 800;
  }

  .price {
    margin: 1.25rem 0;
    color: #111827;
    font-size: 2rem;
    font-weight: 800;
  }

  .spec-list {
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  footer {
    padding: 1rem 1.5rem 1.5rem;
  }

  a {
    color: #1d4ed8;
    font-weight: 700;
  }

  @media (max-width: 760px) {
    h1 {
      font-size: 2rem;
    }

    h2,
    .price {
      font-size: 1.625rem;
    }

    .product-grid {
      grid-template-columns: 1fr;
    }

    .media-panel {
      min-height: auto;
    }

    .run-meta div,
    .spec-list div {
      grid-template-columns: 1fr;
      gap: 0.25rem;
    }
  }
</style>
