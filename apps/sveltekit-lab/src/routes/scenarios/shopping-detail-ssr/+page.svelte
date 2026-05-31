<script lang="ts">
  import ShoppingDetailSsrView from './_components/ShoppingDetailSsrView.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<ShoppingDetailSsrView
  product={data.product}
  requestedSlug={data.requestedSlug}
  source={data.source}
/>
