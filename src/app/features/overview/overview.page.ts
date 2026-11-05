import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <span class="eyebrow">APPLICATION FOUNDATION / F00</span>
      <h1>A clean starting point for the next application.</h1>
      <p>Angular 22 standalone shell with strict TypeScript and a minimal backend integration contract. Security and multi-tenancy will be introduced through tested milestones.</p>
      <a class="primary-action" routerLink="/system/status">Check backend connectivity</a>
    </section>
    <section class="feature-grid" aria-label="Foundation principles">
      <article><h2>Modular by use case</h2><p>Only introduce infrastructure when a real feature needs it.</p></article>
      <article><h2>Secure by design</h2><p>No fabricated login or authorization bypass in this starter.</p></article>
      <article><h2>Observable by default</h2><p>Traceable server requests; telemetry is a separate planned milestone.</p></article>
    </section>
  `
})
export class OverviewPage {}
