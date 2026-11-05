import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MenuApiService } from '../menu-management.service';
import { MenuCategoryDialogComponent } from './menu-category-dialog.component';

describe('MenuCategoryDialogComponent', () => {
  const close = vi.fn();

  beforeEach(async () => {
    close.mockClear();

    await TestBed.configureTestingModule({
      imports: [MenuCategoryDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: { close } },
        {
          provide: MenuApiService,
          useValue: {
            createCategory: () => of(undefined),
            updateCategory: () => of(undefined),
          },
        },
      ],
    }).compileComponents();
  });

  it('should require the category title', () => {
    const fixture = TestBed.createComponent(MenuCategoryDialogComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.invalid).toBe(true);
    fixture.componentInstance.form.controls.title.setValue('خدمات زیبایی');
    expect(fixture.componentInstance.form.valid).toBe(true);
  });

  it('should close with false on cancellation', () => {
    const fixture = TestBed.createComponent(MenuCategoryDialogComponent);
    fixture.componentInstance.cancel();
    expect(close).toHaveBeenCalledWith(false);
  });
});
