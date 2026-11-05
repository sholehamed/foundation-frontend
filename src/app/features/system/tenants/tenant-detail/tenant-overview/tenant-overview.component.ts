import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TenantsService } from '../../tenants.service';

interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  isActive: boolean;
}

@Component({
  selector: 'app-tenant-overview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './tenant-overview.component.html',
  styleUrl: './tenant-overview.component.scss',
})
export class TenantOverviewComponent implements OnInit {
  @Input() tenantId!: string;
  private readonly api = inject(TenantsService);
  readonly details = signal<TenantDetails | null>(null);
  readonly error = signal(false);

  ngOnInit(): void {
    if (!this.tenantId) { this.error.set(true); return; }
    this.api.getById(this.tenantId).subscribe({
      next: data => this.details.set(data as TenantDetails),
      error: () => this.error.set(true),
    });
  }
}
