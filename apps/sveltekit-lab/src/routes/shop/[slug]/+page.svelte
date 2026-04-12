<script lang="ts">
  import type { ProductRow } from '$lib/server/supabase';

  type PageData = {
    product: ProductRow;
  };

  let { data }: { data: PageData } = $props();

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(price);
</script>

<main>
  <h1>Scenario: Shopping Detail (SvelteKit SSR)</h1>
  <p>API: <code>/api/products/{data.product.slug}</code></p>

  <section class="card">
    <img
      src={data.product.image_url}
      alt={data.product.name}
      width={data.product.image_width}
      height={data.product.image_height}
    />

    <h2>{data.product.name}</h2>
    <p>{data.product.description}</p>

    <table>
      <tbody>
        <tr>
          <th>브랜드</th>
          <td>{data.product.brand}</td>
        </tr>
        <tr>
          <th>가격</th>
          <td>{formatPrice(data.product.price, data.product.currency)}</td>
        </tr>
        <tr>
          <th>재고</th>
          <td>{data.product.stock}</td>
        </tr>
        <tr>
          <th>평점</th>
          <td>{data.product.rating}</td>
        </tr>
        <tr>
          <th>생성일</th>
          <td>{new Date(data.product.created_at).toLocaleString('ko-KR')}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <p><a href="/">홈으로 이동</a></p>
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

  img {
    width: 100%;
    height: auto;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    text-align: left;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
</style>
