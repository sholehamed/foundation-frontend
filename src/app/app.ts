import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <header class="site-header">
        <a routerLink="/" class="brand" aria-label="Foundation home">Foundation<span class="brand-mark">.</span></a>
        <nav aria-label="Main navigation">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Overview</a>
          <a routerLink="/system/status" routerLinkActive="active">API status</a>
        </nav>
      </header>
      <main class="content">
        <router-outlet />
      </main>
      <footer class="site-footer">Foundation · F00 starter · No authentication enabled</footer>
    </div>
  `
})
export class App {}
