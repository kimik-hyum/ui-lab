<script setup lang="ts">
import type { DashboardData } from '../../../../../fixtures/dashboard-ssr-types';

defineProps<{ dashboard: DashboardData; delayMs: number }>();
</script>

<template>
  <main
    class="ssr-dashboard"
    data-dashboard-ssr="v1"
    data-framework="nuxt"
    data-render-mode="blocking"
    :data-team-id="dashboard.team.id"
    :data-delay-ms="delayMs"
  >
    <p class="ssr-dashboard__eyebrow">{{ dashboard.team.name }}</p>
    <h1>{{ dashboard.title }}</h1>

    <section class="ssr-dashboard__summary" aria-label="작업 요약">
      <article v-for="item in dashboard.summary" :key="item.label" class="ssr-dashboard__metric">
        <p>{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <section aria-labelledby="dashboard-activities">
      <h2 id="dashboard-activities">최근 활동</h2>
      <ol v-if="dashboard.activities.length > 0" class="ssr-dashboard__activities">
        <li v-for="activity in dashboard.activities" :key="activity.id" :data-activity-id="activity.id">
          <h3>{{ activity.title }}</h3>
          <p>{{ activity.status }} · {{ activity.owner }} · {{ activity.time }}</p>
        </li>
      </ol>
      <p v-else class="ssr-dashboard__empty">아직 기록된 활동이 없습니다.</p>
    </section>

    <p class="ssr-dashboard__ready" data-dashboard-ready="v1">서버에서 준비한 작업 현황</p>
  </main>
</template>
