import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RoleFormComponent } from './role-form.component';

describe('RoleFormComponent', () => {
  let component: RoleFormComponent;
  let fixture: ComponentFixture<RoleFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleFormComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(RoleFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates with a validated live role form', () => {
    expect(component).toBeTruthy();
    expect(component.form.invalid).toBe(true);
    component.form.controls.name.setValue('CI Test Role');
    expect(component.form.valid).toBe(true);
  });
});
