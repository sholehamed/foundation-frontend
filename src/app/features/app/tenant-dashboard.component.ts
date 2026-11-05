import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../shared/services/auth.service';

interface WorkspaceSummary {
  tenant: { id: string; name: string; slug: string };
  profile: { displayName: string; activityType: string; city: string;
    address: string; requestedPlanKey: string; requestedBillingCycle: string } | null;
  mainBranch: { id: string; name: string; city: string; address: string } | null;
  subscriptionStatus: 'pending_activation';
}

@Component({
  standalone: true,
  selector: 'app-tenant-dashboard',
  imports: [MatButtonModule],
  template: `
  <main dir="rtl" class="workspace">
    <header>
      <div>
        <p class="eyebrow">SHINERA / WORKSPACE</p>
        <h1>{{ workspace()?.tenant?.name || 'فضای کاری شاینرا' }}</h1>
        <p>به فضای کاری اختصاصی خودت خوش آمدی.</p>
      </div>
      <button mat-stroked-button (click)="logout()">خروج از حساب</button>
    </header>
    @if (loading()) {
      <p role="status">در حال دریافت اطلاعات فضای کاری...</p>
    } @else if (error()) {
      <p role="alert" class="error">{{ error() }}</p>
      <button mat-flat-button (click)="load()">تلاش مجدد</button>
    } @else if (workspace(); as data) {
      <div class="grid">
        <article>
          <small>کسب‌وکار</small>
          <h2>{{ data.profile?.displayName ?? data.tenant.name }}</h2>
          <p>{{ data.profile?.city }} — {{ data.profile?.address }}</p>
        </article>
        <article>
          <small>شعبه اصلی</small>
          <h2>{{ data.mainBranch?.name ?? '—' }}</h2>
          <p>{{ data.mainBranch?.city }} — {{ data.mainBranch?.address }}</p>
        </article>
        <article>
          <small>اشتراک</small>
          <h2>در انتظار فعال‌سازی</h2>
          <p>پلن درخواستی: {{ data.profile?.requestedPlanKey ?? '—' }}</p>
          <p>ساخت فضای کاری به معنی تأیید پرداخت یا فعال‌شدن امکانات پولی نیست.</p>
        </article>
      </div>
    }
  </main>`,
  styles: [`
    :host { display:block; min-height:100vh; background:var(--bodyBackgroundColor,#f9f6f7);
      color:var(--headingColor,#27232a); font-family:Shabnam,sans-serif; }
    .workspace {max-width:1100px;margin:auto;padding:55px 24px;}
    header {display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;
      margin-bottom:32px}
    h1 {font-size:30px;margin:10px 0} h2 {font-size:19px;margin:14px 0}
    p {color:var(--bodyColor,#737078);line-height:1.9}
    .eyebrow {letter-spacing:2px;color:#a65d6d;font-size:11px}
    .grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}
    article {padding:25px;border:1px solid #e8e0e2;border-radius:18px;background:var(--cardBgColor,#fff)}
    small {color:#a65d6d}.error {color:#d64545}
  `]
})
export class TenantDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly workspace = signal<WorkspaceSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<WorkspaceSummary>(environment.apiUrl + '/tenant/workspace').subscribe({
      next: data => { this.workspace.set(data); this.loading.set(false); },
      error: () => {
        this.error.set('دریافت اطلاعات فضای کاری انجام نشد.');
        this.loading.set(false);
      }
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
