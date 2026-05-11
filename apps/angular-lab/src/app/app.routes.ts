import { Routes } from '@angular/router';
import { HomePageComponent } from './home/home-page.component';
import { productResolver } from './shop/product.resolver';
import { ShopProductDetailComponent } from './shop/shop-product-detail.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent
  },
  {
    path: 'shop/:slug',
    component: ShopProductDetailComponent,
    resolve: {
      product: productResolver
    }
  }
];
