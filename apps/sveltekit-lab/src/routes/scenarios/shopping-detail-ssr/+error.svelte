<script lang="ts">
  import { page } from '$app/state';
</script>

<main>
  <article class="surface" aria-labelledby="scenario-error-title">
    <header class="header">
      <p class="eyebrow">SvelteKit SSR Harness</p>
      <h1 id="scenario-error-title">Scenario: Shopping Detail SSR</h1>
      <p class="status">HTTP {page.status}</p>
      <p class="message">
        {page.error?.message ?? '상품 상세를 불러오지 못했습니다.'}
      </p>
    </header>
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
    border: 1px solid #f0c4c4;
    border-radius: 8px;
    background: #ffffff;
    overflow: hidden;
  }

  .header {
    padding: 1.5rem;
  }

  .eyebrow {
    margin: 0 0 0.5rem;
    color: #b91c1c;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  h1 {
    margin: 0 0 0.5rem;
    color: #111827;
    font-size: 2rem;
    line-height: 1.1;
  }

  .status {
    margin: 0 0 0.25rem;
    color: #6b7280;
    font-weight: 700;
  }

  .message {
    margin: 0;
    color: #4b5563;
    line-height: 1.6;
  }

  footer {
    padding: 0 1.5rem 1.5rem;
  }

  a {
    color: #1d4ed8;
    font-weight: 700;
  }
</style>
