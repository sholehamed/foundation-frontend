import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import {
  TenantAdminCapabilities, TenantAdminGroup, TenantDirectoryPage, TenantWorkspaceService,
} from './tenant-workspace.service';

@Component({
  selector: 'app-tenant-groups',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule],
  templateUrl: './tenant-groups.component.html',
  styleUrl: './tenant-workspace.styles.scss',
})
export class TenantGroupsComponent implements OnInit {
  private readonly api = inject(TenantWorkspaceService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
  });

  readonly page = signal(1);
  readonly groups = signal<TenantDirectoryPage<TenantAdminGroup> | null>(null);
  readonly permissions = signal<TenantAdminCapabilities | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editorOpen = signal(false);
  readonly editTarget = signal<TenantAdminGroup | null>(null);
  readonly pendingState = signal<TenantAdminGroup | null>(null);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    if (this.loading() || this.saving()) return;
    this.loading.set(true);
    this.groups.set(null);
    this.permissions.set(null);
    this.error.set(null);
    this.cancelEditor();
    this.pendingState.set(null);
    const currentPage = this.page();
    forkJoin({
      groups: this.api.getGroups(currentPage),
      permissions: this.api.getAdminCapabilities(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ groups, permissions }) => {
        if (!groups || !Array.isArray(groups.items) || groups.page !== currentPage ||
            typeof groups.hasNext !== 'boolean' ||
            !permissions || typeof permissions.canCreateGroups !== 'boolean' ||
            typeof permissions.canUpdateGroups !== 'boolean' ||
            typeof permissions.canChangeGroupState !== 'boolean') {
          this.error.set('پاسخ سرویس مدیریت گروه‌ها معتبر نیست.');
        } else {
          this.groups.set(groups);
          this.permissions.set(permissions);
        }
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.error.set(err.status === 403
          ? 'مجوز مشاهده گروه‌های این فضای کاری را ندارید.'
          : 'دریافت گروه‌های فضای کاری ناموفق بود.');
        this.loading.set(false);
      },
    });
  }

  previous(): void {
    if (!this.loading() && !this.saving() && this.page() > 1) {
      this.page.update(x => x - 1);
      this.load();
    }
  }

  next(): void {
    if (!this.loading() && !this.saving() && this.groups()?.hasNext) {
      this.page.update(x => x + 1);
      this.load();
    }
  }

  openCreate(): void {
    if (this.loading() || this.saving() || !this.permissions()?.canCreateGroups) return;
    this.editTarget.set(null);
    this.form.reset({ name: '', description: '' });
    this.saveError.set(null);
    this.notice.set(null);
    this.pendingState.set(null);
    this.editorOpen.set(true);
  }

  openEdit(group: TenantAdminGroup): void {
    if (this.loading() || this.saving() || !this.permissions()?.canUpdateGroups ||
        !group.version || !this.groups()?.items.some(x => x.id === group.id)) return;
    this.editTarget.set(group);
    this.form.reset({ name: group.name, description: group.description ?? '' });
    this.saveError.set(null);
    this.notice.set(null);
    this.pendingState.set(null);
    this.editorOpen.set(true);
  }

  cancelEditor(): void {
    if (this.saving()) return;
    this.editorOpen.set(false);
    this.editTarget.set(null);
    this.saveError.set(null);
    this.form.reset({ name: '', description: '' });
  }

  save(): void {
    if (!this.editorOpen() || this.saving() || this.loading()) return;
    const target = this.editTarget();
    if (target && !this.permissions()?.canUpdateGroups) return;
    if (!target && !this.permissions()?.canCreateGroups) return;
    const raw = this.form.getRawValue();
    const name = raw.name.trim();
    const description = raw.description.trim() || null;
    this.form.patchValue({ name, description: description ?? '' });
    if (this.form.invalid || ['OWNER', 'SUPERADMIN', 'SYSTEMADMIN'].includes(name.toUpperCase())) {
      this.saveError.set('نام گروه باید ۲ تا ۱۰۰ کاراکتر و غیررزرو شده باشد.');
      return;
    }
    if (target && !target.version) return;
    this.saving.set(true);
    this.saveError.set(null);
    const request = { name, description };
    const mutation = target
      ? this.api.updateGroup(target.id, { ...request, expectedVersion: target.version })
      : this.api.createGroup(request);
    mutation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEditor();
        if (!target) this.page.set(1);
        this.notice.set(target ? 'مشخصات گروه به‌روزرسانی شد.' : 'گروه جدید بدون عضو یا نقش ایجاد شد.');
        this.load();
      },
      error: (err: { status?: number }) => this.handleWriteError(err),
    });
  }

  requestStateChange(group: TenantAdminGroup): void {
    if (this.loading() || this.saving() || this.editorOpen() ||
        !this.permissions()?.canChangeGroupState || !group.version ||
        !this.groups()?.items.some(x => x.id === group.id)) return;
    this.pendingState.set(group);
    this.saveError.set(null);
    this.notice.set(null);
  }

  cancelState(): void { if (!this.saving()) this.pendingState.set(null); }

  confirmState(): void {
    const target = this.pendingState();
    if (!target || this.saving() || !this.permissions()?.canChangeGroupState) return;
    this.saving.set(true);
    this.api.changeGroupState(target.id, {
      isActive: !target.isActive, expectedVersion: target.version,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.pendingState.set(null);
        this.notice.set(target.isActive
          ? 'گروه غیرفعال شد؛ دسترسی‌های حاصل از آن دیگر مؤثر نیستند.'
          : 'گروه دوباره فعال شد.');
        this.load();
      },
      error: (err: { status?: number }) => this.handleWriteError(err),
    });
  }

  private handleWriteError(err: { status?: number }): void {
    this.saving.set(false);
    if (err.status === 403 || err.status === 404) {
      this.editorOpen.set(false);
      this.pendingState.set(null);
      this.groups.set(null);
      this.permissions.set(null);
      this.error.set('دسترسی مدیریت گروه لغو شده یا گروه متعلق به این فضای کاری نیست.');
    } else if (err.status === 409) {
      this.cancelEditor();
      this.pendingState.set(null);
      this.notice.set('گروه تغییر کرده یا نام تکراری است. اطلاعات تازه دریافت شد؛ مجدداً بررسی کنید.');
      this.load();
    } else {
      this.saveError.set(err.status === 400
        ? 'اطلاعات گروه معتبر نیست؛ مقادیر را بررسی کنید.'
        : 'ذخیره تغییرات گروه ناموفق بود؛ دوباره تلاش کنید.');
    }
  }
}
