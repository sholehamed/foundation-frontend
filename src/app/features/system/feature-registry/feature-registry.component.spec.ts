import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FeatureRegistryApiService, FeatureRegistryPreview } from './feature-registry-api.service';
import { FeatureRegistryPageComponent } from './feature-registry.component';

describe('FeatureRegistryPageComponent safe review workflow', () => {
  const pending: FeatureRegistryPreview = {
    canApply: true,
    hasPending: true,
    changes: [{ type: 'Permission', key: 'ROLES.READ', state: 'Create', detail: null }],
  };
  let fixture: ComponentFixture<FeatureRegistryPageComponent>;
  let preview: ReturnType<typeof vi.fn>;
  let apply: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    preview = vi.fn(() => of(pending));
    apply = vi.fn(() => of({ canApply: true, hasPending: false, changes: [] }));

    await TestBed.configureTestingModule({
      imports: [FeatureRegistryPageComponent],
      providers: [
        { provide: FeatureRegistryApiService, useValue: { preview, apply } },
      ],
    }).overrideComponent(FeatureRegistryPageComponent, {
      set: { template: '' },
    }).compileComponents();
    fixture = TestBed.createComponent(FeatureRegistryPageComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fixture.destroy();
  });

  it('previews on entry but does not apply automatically', () => {
    fixture.componentInstance.ngOnInit();
    expect(preview).toHaveBeenCalledOnce();
    expect(apply).not.toHaveBeenCalled();
    expect(fixture.componentInstance.count('Create')).toBe(1);
  });

  it('requires explicit confirmation before one Apply and refreshes after success', () => {
    fixture.componentInstance.ngOnInit();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentInstance.applyChanges();
    expect(apply).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fixture.componentInstance.applyChanges();
    expect(apply).toHaveBeenCalledOnce();
    expect(preview).toHaveBeenCalledTimes(2);
  });

  it('blocks Apply for missing preview or conflict and clears stale preview on errors', () => {
    fixture.componentInstance.applyChanges();
    expect(apply).not.toHaveBeenCalled();

    preview.mockReturnValueOnce(of({
      canApply: false, hasPending: true,
      changes: [{ type: 'ApiResource', key: 'DUPLICATE', state: 'Conflict', detail: null }],
    }));
    fixture.componentInstance.ngOnInit();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.applyChanges();
    expect(apply).not.toHaveBeenCalled();

    preview.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    fixture.componentInstance.loadPreview();
    expect(fixture.componentInstance.preview()).toBeNull();
    expect(fixture.componentInstance.error()).toContain('مجاز نیست');
  });

  it('disables stale successful previews after a 409 apply failure', () => {
    fixture.componentInstance.ngOnInit();
    apply.mockReturnValue(throwError(() => ({ status: 409 })));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.applyChanges();
    expect(fixture.componentInstance.preview()).toBeNull();
    expect(fixture.componentInstance.error()).toContain('متوقف');
  });
});
