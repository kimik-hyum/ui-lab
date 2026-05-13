<script setup lang="ts">
import type { ProductApiResponse, ProductRow } from "../../types/product";

const route = useRoute();
const slug = computed(() => String(route.params.slug));

const { data, error } = await useFetch<ProductApiResponse>(
  () => `/api/products/${slug.value}`,
  {
    key: () => `product:${slug.value}`,
    server: true,
  },
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage ?? "상품 조회에 실패했습니다.",
  });
}

const loadedProduct = data.value?.product;

if (!loadedProduct) {
  throw createError({
    statusCode: 404,
    statusMessage: "상품을 찾을 수 없습니다.",
  });
}

const product: ProductRow = loadedProduct;

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
</script>

<template>
  <main>
    <h1>Scenario: Shopping Detail (Nuxt SSR)</h1>
    <p>
      API: <code>/api/products/{{ product.slug }}</code>
    </p>

    <section class="card">
      <img
        :src="product.image_url"
        :alt="product.name"
        :width="product.image_width"
        :height="product.image_height"
      />

      <h2>{{ product.name }}</h2>
      <p>{{ product.description }}</p>

      <table>
        <tbody>
          <tr>
            <th>브랜드</th>
            <td>{{ product.brand }}</td>
          </tr>
          <tr>
            <th>가격</th>
            <td>{{ formatPrice(product.price, product.currency) }}</td>
          </tr>
          <tr>
            <th>재고</th>
            <td>{{ product.stock }}</td>
          </tr>
          <tr>
            <th>평점</th>
            <td>{{ product.rating }}</td>
          </tr>
          <tr>
            <th>생성일</th>
            <td>{{ new Date(product.created_at).toLocaleString("ko-KR") }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <p>
      <NuxtLink to="/">홈으로 이동</NuxtLink>
    </p>
  </main>
</template>
