import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should start with a required empty user profile form', async () => {
    const fixture = TestBed.createComponent(UserFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(fixture.componentInstance.form.controls['firstName'].hasError('required')).toBe(true);
  });
});
