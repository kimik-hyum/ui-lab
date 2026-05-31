<script setup lang="ts">
import type { ProductRow } from "../../../types/product";
import {
  formatShoppingDetailSsrDate,
  formatShoppingDetailSsrPrice,
} from "#shared/scenarios/shopping-detail-ssr/formatters";

defineProps<{
  product: ProductRow;
  requestedSlug: string;
  source: string;
}>();
</script>

<template>
  <main class="shopping-detail-ssr">
    <header class="scenario-header">
      <p class="scenario-label">Nuxt native SSR harness</p>
      <h1>Scenario: Shopping Detail SSR (Nuxt)</h1>
      <p class="scenario-summary">
        SSR helper: <code>{{ source }}</code>
      </p>
      <p class="scenario-meta">
        slug <strong>{{ requestedSlug }}</strong>
      </p>
    </header>

    <section class="product-surface" aria-labelledby="shopping-detail-ssr-product">
      <div class="media-column">
        <img
          :src="product.image_url"
          :alt="product.name"
          :width="product.image_width"
          :height="product.image_height"
        />
      </div>

      <div class="content-column">
        <p class="brand">{{ product.brand }}</p>
        <h2 id="shopping-detail-ssr-product">{{ product.name }}</h2>
        <p class="description">{{ product.description }}</p>

        <dl class="product-facts">
          <div>
            <dt>가격</dt>
            <dd>{{ formatShoppingDetailSsrPrice(product.price, product.currency) }}</dd>
          </div>
          <div>
            <dt>재고</dt>
            <dd>{{ product.stock }}개</dd>
          </div>
          <div>
            <dt>평점</dt>
            <dd>{{ product.rating }}</dd>
          </div>
          <div>
            <dt>생성일</dt>
            <dd>
              <time :datetime="product.created_at">
                {{ formatShoppingDetailSsrDate(product.created_at) }}
              </time>
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <p class="home-link">
      <NuxtLink to="/">홈으로 이동</NuxtLink>
    </p>
  </main>
</template>

<style scoped>
.shopping-detail-ssr {
  max-width: 1040px;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
}

.scenario-header {
  margin-bottom: 1.5rem;
}

.scenario-label {
  margin: 0 0 0.5rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
}

.scenario-header h1 {
  margin: 0;
  font-size: 2.75rem;
  line-height: 1.05;
}

.scenario-summary,
.scenario-meta {
  max-width: 760px;
  margin: 0.75rem 0 0;
  color: #334155;
  line-height: 1.7;
}

.scenario-summary code {
  padding: 0.125rem 0.375rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 0.875rem;
}

.product-surface {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(0, 1.1fr);
  gap: 1.25rem;
  align-items: stretch;
  border: 1px solid #dbe3ea;
  border-radius: 8px;
  background: #ffffff;
  padding: 1rem;
}

.media-column {
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: #eef2f7;
}

.media-column img {
  display: block;
  width: 100%;
  height: auto;
}

.content-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 0.5rem;
}

.brand {
  margin: 0 0 0.5rem;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 800;
}

.content-column h2 {
  margin: 0;
  font-size: 2.25rem;
  line-height: 1.1;
}

.description {
  margin: 1rem 0 1.25rem;
  color: #475569;
  line-height: 1.7;
}

.product-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.product-facts div {
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.875rem;
  background: #f8fafc;
}

.product-facts dt {
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 700;
}

.product-facts dd {
  margin: 0.25rem 0 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.home-link {
  margin: 1.25rem 0 0;
}

.home-link a {
  color: #2563eb;
  font-weight: 700;
}

@media (max-width: 760px) {
  .scenario-header h1 {
    font-size: 2rem;
  }

  .content-column h2 {
    font-size: 1.625rem;
  }

  .product-surface {
    grid-template-columns: 1fr;
  }

  .product-facts {
    grid-template-columns: 1fr;
  }
}
</style>
