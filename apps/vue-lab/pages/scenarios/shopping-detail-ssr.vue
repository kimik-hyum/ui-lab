<script setup lang="ts">
import ShoppingDetailSsrView from "../../components/scenarios/shopping-detail-ssr/ShoppingDetailSsrView.vue";
import {
  SHOPPING_DETAIL_SSR_DEFAULT_SLUG,
  type ShoppingDetailSsrResponse,
} from "#shared/scenarios/shopping-detail-ssr/types";

const route = useRoute();
const rawSlug = Array.isArray(route.query.slug) ? route.query.slug[0] : route.query.slug;
const requestedSlug =
  typeof rawSlug === "string" && rawSlug.trim().length > 0
    ? rawSlug.trim()
    : SHOPPING_DETAIL_SSR_DEFAULT_SLUG;

const { data, error } = await useFetch<ShoppingDetailSsrResponse>(
  "/api/scenarios/shopping-detail-ssr",
  {
    key: `scenario:shopping-detail-ssr:${requestedSlug}`,
    query: { slug: requestedSlug },
    server: true,
  },
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage ?? "SSR Product Lookup Failed",
    message: error.value.message ?? "SSR 상품 조회에 실패했습니다.",
  });
}

if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Not Found",
    message: "상품을 찾을 수 없습니다.",
  });
}

const scenario = data.value;

useHead({
  title: `Scenario: Shopping Detail SSR - ${scenario.product.name}`,
});
</script>

<template>
  <ShoppingDetailSsrView
    :product="scenario.product"
    :requested-slug="scenario.requestedSlug"
    :source="scenario.source"
  />
</template>
