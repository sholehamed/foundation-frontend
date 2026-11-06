import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminFormComponent } from './admin-form.component';

describe('AdminFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should start with a required empty user profile form', async () => {
    const fixture = TestBed.createComponent(AdminFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(fixture.componentInstance.form.controls['firstName'].hasError('required')).toBe(true);
  });
});
