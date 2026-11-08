import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: '<main dir="rtl" style="padding:3rem"><h1>دسترسی مجاز نیست</h1>' +
    '<p>حساب شما برای ورود به این فضای کاری تأیید نشده است.</p>' +
    '<a routerLink="/auth/login">بازگشت به ورود</a></main>',
})
export class TenantAccessDeniedComponent {}
