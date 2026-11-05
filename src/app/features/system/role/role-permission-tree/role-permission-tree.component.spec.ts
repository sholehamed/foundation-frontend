import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolePermissionTreeComponent } from './role-permission-tree.component';

describe('RolePermissionTreeComponent', () => {
  let component: RolePermissionTreeComponent;
  let fixture: ComponentFixture<RolePermissionTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolePermissionTreeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RolePermissionTreeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
