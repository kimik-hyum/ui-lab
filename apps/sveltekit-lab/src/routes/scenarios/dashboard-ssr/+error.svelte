<script lang="ts">
  import { page } from '$app/state';
  import '../../../../../../fixtures/dashboard-ssr.css';
</script>

<main class="ssr-dashboard">
  <p class="ssr-dashboard__eyebrow">HTTP {page.status}</p>
  <h1>작업 현황을 불러오지 못했습니다.</h1>
  <p class="ssr-dashboard__empty">{page.error?.message ?? '잠시 후 다시 시도해주세요.'}</p>
</main>
