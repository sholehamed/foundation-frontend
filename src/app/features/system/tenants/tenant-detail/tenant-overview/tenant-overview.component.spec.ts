import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenantOverviewComponent } from './tenant-overview.component';

describe('TenantOverviewComponent', () => {
  let component: TenantOverviewComponent;
  let fixture: ComponentFixture<TenantOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantOverviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantOverviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
