import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-system-access-denied',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main dir="rtl" style="min-height:60vh;display:grid;place-content:center;text-align:center;gap:1rem;padding:2rem">
      <h1>دسترسی به این بخش مجاز نیست</h1>
      <p>برای مشاهده این صفحه به مجوز معتبر نیاز دارید. در صورت لزوم با مدیر سامانه تماس بگیرید.</p>
      <a routerLink="/system/auth/login">بازگشت به ورود</a>
    </main>
  `,
})
export class SystemAccessDeniedComponent {}
