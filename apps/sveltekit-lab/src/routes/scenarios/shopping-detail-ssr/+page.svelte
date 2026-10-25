<script lang="ts">
  import ShoppingDetailSsrView from './_components/ShoppingDetailSsrView.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

{#await data.product}
  <main>
    <h1>Scenario: Shopping Detail SSR</h1>
    <p role="status">상품 상세 SSR 데이터를 준비하는 중입니다.</p>
  </main>
{:then product}
  {#if product}
    <ShoppingDetailSsrView
      {product}
      requestedSlug={data.requestedSlug}
      source={data.source}
    />
  {:else}
    <main>
      <h1>상품을 찾을 수 없습니다.</h1>
      <p>요청한 상품이 없거나 삭제되었습니다.</p>
      <a href="/">홈으로 이동</a>
    </main>
  {/if}
{:catch}
  <main>
    <h1>상품 조회에 실패했습니다.</h1>
    <p>잠시 후 다시 시도해주세요.</p>
    <a href="/">홈으로 이동</a>
  </main>
{/await}
