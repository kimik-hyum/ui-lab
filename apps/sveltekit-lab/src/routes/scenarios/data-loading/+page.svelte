<script lang="ts">
  type PageData = {
    framework: string;
    message: string;
    elapsedMs: number;
    renderedAt: string;
  };

  let { data }: { data: PageData } = $props();
</script>

<main>
  <h1>Scenario: Data Loading (SvelteKit)</h1>
  <div class="card">
    <p>framework: {data.framework}</p>
    <p>message: {data.message}</p>
    <p>elapsedMs: {data.elapsedMs}</p>
    <p>renderedAt: {data.renderedAt}</p>
  </div>
</main>

<style>
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
  }

  .card {
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    background: #ffffff;
    padding: 1rem;
  }
</style>
