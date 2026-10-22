<script setup lang="ts">
import { createError, useFetch, useHead, useRoute } from '#imports';
import '../../../../fixtures/dashboard-ssr.css';
import DashboardSsrView from '../../components/scenarios/dashboard-ssr/DashboardSsrView.vue';
import type { DashboardSsrResponse } from '../../shared/scenarios/dashboard-ssr/types';

// [cmp:boundary:start]
const route = useRoute();
const query = { team: route.query.team, delay: route.query.delay };
// 서버 코드는 Nitro handler 안에 두고 페이지는 useFetch로 접근합니다.
// [cmp:boundary:end]

// [cmp:loading:start]
// SSR 결과는 payload로 전달되어 hydration 때 같은 데이터를 다시 요청하지 않습니다.
const { data, error } = await useFetch<DashboardSsrResponse>('/api/scenarios/dashboard-ssr', {
  query,
  server: true,
  lazy: false,
  watch: false,
  retry: 0,
});
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage ?? 'Dashboard Lookup Failed',
    message: '작업 현황을 불러오지 못했습니다.',
    fatal: true,
  });
}
if (!data.value) {
  throw createError({ statusCode: 500, message: '작업 현황 응답이 비어 있습니다.', fatal: true });
}
// [cmp:loading:end]

useHead({ title: '팀 작업 현황 · Nuxt SSR' });
</script>

<template>
  <!-- [cmp:output:start] -->
  <DashboardSsrView v-if="data" :dashboard="data.dashboard" :delay-ms="data.delayMs" />
  <!-- [cmp:output:end] -->
</template>
