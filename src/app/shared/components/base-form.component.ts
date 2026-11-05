// shared/components/base-form.component.ts
import { Directive, HostListener, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map, defaultIfEmpty } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router'; // اضافه کردن Router
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Directive()
export abstract class BaseFormComponent {
  abstract form: FormGroup;
  isSaving = false;
  abstract backUrl?:any[]
  protected router = inject(Router); 
  protected route = inject(ActivatedRoute);

  constructor(protected dialog: MatDialog) {}

  get hasPendingChanges(): boolean {
    return !!this.form && this.form.dirty && !this.isSaving;
  }
 back(): void {
  if (this.backUrl) {
    this.router.navigate(this.backUrl);
    return;
  }

  this.router.navigate(['../'], { relativeTo: this.route });
}
  canDeactivate(): boolean | Observable<boolean> {
    // اگر فرم تغییر نکرده، بدون باز کردن دیالوگ اجازه خروج بده
    if (!this.hasPendingChanges) {
      return true;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true, // جلوی بستن با کلیک روی پس‌زمینه را می‌گیرد تا کاربر مجبور به انتخاب شود
      data: {
        title: 'تغییرات ذخیره نشده',
        message: 'تغییرات شما ذخیره نشده‌اند. آیا مطمئن هستید که می‌خواهید خارج شوید؟',
        cancelLabel: 'ماندن در صفحه',
        acceptLabel: 'خروج بدون ذخیره'
      }
    });

    return dialogRef.afterClosed().pipe(
      // تبدیل هر مقداری (حتی undefined در صورت فشردن کلید Escape) به boolean
      map(result => !!result),
      defaultIfEmpty(false)
    );
  }

  // این رویداد فقط و فقط برای رفرش صفحه یا بستن تب است و نباید با تغییر مسیرهای داخلی تداخل داشته باشد
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasPendingChanges) {
      $event.preventDefault();
      $event.returnValue = ''; // مرورگر پیغام پیش‌فرض خود را نشان می‌دهد
    }
  }
}
