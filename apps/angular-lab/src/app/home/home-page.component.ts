import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <main>
      <h1>Angular Lab</h1>
      <p>모노레포 비교 실험용 Angular SSR 앱입니다.</p>
      <p>
        쇼핑몰 SSR 상세:
        <a routerLink="/shop/wireless-headphones-x1">/shop/wireless-headphones-x1</a>
      </p>
    </main>
  `
})
export class HomePageComponent {}
