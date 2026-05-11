import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Product } from '../core/product';

@Component({
  selector: 'app-shop-product-detail',
  imports: [RouterLink],
  template: `
    <main>
      <h1>Scenario: Shopping Detail (Angular SSR)</h1>
      <p>API: <code>/api/products/{{ product.slug }}</code></p>

      <section class="card">
        <img
          [src]="product.image_url"
          [alt]="product.name"
          [attr.width]="product.image_width"
          [attr.height]="product.image_height"
        />

        <h2>{{ product.name }}</h2>
        <p>{{ product.description }}</p>

        <table>
          <tbody>
            <tr>
              <th>브랜드</th>
              <td>{{ product.brand }}</td>
            </tr>
            <tr>
              <th>가격</th>
              <td>{{ priceLabel }}</td>
            </tr>
            <tr>
              <th>재고</th>
              <td>{{ stockLabel }}</td>
            </tr>
            <tr>
              <th>평점</th>
              <td>{{ ratingLabel }}</td>
            </tr>
            <tr>
              <th>생성일</th>
              <td>{{ createdAtLabel }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <p><a routerLink="/">홈으로 이동</a></p>
    </main>
  `
})
export class ShopProductDetailComponent {
  protected readonly product: Product;
  protected readonly priceLabel: string;
  protected readonly stockLabel: string;
  protected readonly ratingLabel: string;
  protected readonly createdAtLabel: string;

  constructor() {
    const route = inject(ActivatedRoute);
    this.product = route.snapshot.data['product'] as Product;
    this.priceLabel = new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: this.product.currency,
      maximumFractionDigits: 0
    }).format(this.product.price);
    this.stockLabel = this.product.stock.toString();
    this.ratingLabel = this.product.rating.toString();
    this.createdAtLabel = new Date(this.product.created_at).toLocaleString('ko-KR');
  }
}
