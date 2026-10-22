<script lang="ts">
  import type { DashboardData } from '../../../../../../../fixtures/dashboard-ssr-types';

  let { dashboard, delayMs }: { dashboard: DashboardData; delayMs: number } = $props();
</script>

<main
  class="ssr-dashboard"
  data-dashboard-ssr="v1"
  data-framework="sveltekit"
  data-render-mode="blocking"
  data-team-id={dashboard.team.id}
  data-delay-ms={delayMs}
>
  <p class="ssr-dashboard__eyebrow">{dashboard.team.name}</p>
  <h1>{dashboard.title}</h1>

  <section class="ssr-dashboard__summary" aria-label="작업 요약">
    {#each dashboard.summary as item (item.label)}
      <article class="ssr-dashboard__metric">
        <p>{item.label}</p>
        <strong>{item.value}</strong>
      </article>
    {/each}
  </section>

  <section aria-labelledby="dashboard-activities">
    <h2 id="dashboard-activities">최근 활동</h2>
    {#if dashboard.activities.length > 0}
      <ol class="ssr-dashboard__activities">
        {#each dashboard.activities as activity (activity.id)}
          <li data-activity-id={activity.id}>
            <h3>{activity.title}</h3>
            <p>{activity.status} · {activity.owner} · {activity.time}</p>
          </li>
        {/each}
      </ol>
    {:else}
      <p class="ssr-dashboard__empty">아직 기록된 활동이 없습니다.</p>
    {/if}
  </section>

  <p class="ssr-dashboard__ready" data-dashboard-ready="v1">서버에서 준비한 작업 현황</p>
</main>
