<script lang="ts">
  import '../../../../../../fixtures/dashboard-ssr.css';
  import DashboardSsrView from './_components/DashboardSsrView.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>팀 작업 현황 · SvelteKit SSR</title>
</svelte:head>

<!-- [cmp:output:start] -->
<DashboardSsrView dashboard={data.dashboard} delayMs={data.delayMs} />
<!-- [cmp:output:end] -->
