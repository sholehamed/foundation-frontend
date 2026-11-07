import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FeatureRegistryApiService, FeatureRegistryPreview } from './feature-registry-api.service';
import { FeatureRegistryPageComponent } from './feature-registry.component';
import { BackendFeatureManifest } from './feature-registry-contract';
import { systemFeatureRoutes } from './system-feature.manifest';

describe('FeatureRegistryPageComponent safe cross-repo review workflow', () => {
  const pending: FeatureRegistryPreview = {
    canApply: true, hasPending: true,
    changes: [{ type: 'Permission', key: 'ROLES.READ', state: 'Create', detail: null }],
  };
  const contract: BackendFeatureManifest = {
    schemaVersion: 1,
    features: systemFeatureRoutes.map(route => {
      const resourceCode = route.slice('/system/'.length);
      return {
        key: 'system.' + resourceCode,
        pageKey: 'system.' + resourceCode,
        moduleCode: 'system',
        resourceCode,
        route,
        readPermission: resourceCode.toUpperCase() + '.READ',
      };
    }),
  };
  let fixture: ComponentFixture<FeatureRegistryPageComponent>;
  let preview: ReturnType<typeof vi.fn>;
  let manifest: ReturnType<typeof vi.fn>;
  let apply: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    preview = vi.fn(() => of(pending));
    manifest = vi.fn(() => of(contract));
    apply = vi.fn(() => of({ canApply: true, hasPending: false, changes: [] }));

    await TestBed.configureTestingModule({
      imports: [FeatureRegistryPageComponent],
      providers: [
        { provide: FeatureRegistryApiService, useValue: { preview, manifest, apply } },
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

  it('loads both contracts, previews differences but never applies on entry', () => {
    fixture.componentInstance.ngOnInit();
    expect(preview).toHaveBeenCalledOnce();
    expect(manifest).toHaveBeenCalledOnce();
    expect(apply).not.toHaveBeenCalled();
    expect(fixture.componentInstance.manifestVerified()).toBe(true);
    expect(fixture.componentInstance.manifestProblems()).toEqual([]);
    expect(fixture.componentInstance.count('Create')).toBe(1);
  });

  it('requires explicit confirmation before Apply and re-reads both contracts', () => {
    fixture.componentInstance.ngOnInit();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentInstance.applyChanges();
    expect(apply).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fixture.componentInstance.applyChanges();
    expect(apply).toHaveBeenCalledOnce();
    expect(preview).toHaveBeenCalledTimes(2);
    expect(manifest).toHaveBeenCalledTimes(2);
  });

  it('blocks Apply on backend/Angular route drift even when preview is valid', () => {
    manifest.mockReturnValue(of({ ...contract, features: contract.features.slice(0, 2) }));
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.manifestProblems().length).toBeGreaterThan(0);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.applyChanges();
    expect(apply).not.toHaveBeenCalled();
  });

  it('blocks Apply for conflicting preview and clears stale state on 403', () => {
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

    manifest.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    fixture.componentInstance.loadPreview();
    expect(fixture.componentInstance.preview()).toBeNull();
    expect(fixture.componentInstance.manifestVerified()).toBe(false);
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
