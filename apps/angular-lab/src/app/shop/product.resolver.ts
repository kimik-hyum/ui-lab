import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Product, ProductApiResponse } from '../core/product';

export const productResolver: ResolveFn<Product> = async (route) => {
  const slug = route.paramMap.get('slug');

  if (!slug) {
    throw new Error('상품 slug가 비어 있습니다.');
  }

  const http = inject(HttpClient);

  try {
    const payload = await firstValueFrom(
      http.get<ProductApiResponse>(`/api/products/${slug}`)
    );

    return payload.product;
  } catch (error) {
    if (error instanceof HttpErrorResponse) {
      throw new Error(`상품 조회 실패: ${error.status}`);
    }

    throw error;
  }
};
