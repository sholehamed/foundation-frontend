import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FeatureRegistryApiService, FeatureRegistryPreview } from './feature-registry-api.service';
import { FeatureRegistryPageComponent } from './feature-registry.component';
import { BackendFeatureManifest } from './feature-registry-contract';
import { discoverExecutableSystemChildRoutes } from './system-ui-route-discovery';
import { mockManifestForRoutes } from './registry-manifest.test-fixture';

describe('FeatureRegistryPageComponent safe cross-repo review workflow', () => {
  const pending: FeatureRegistryPreview = {
    canApply: true, hasPending: true,
    changes: [{ type: 'UiResource', key: 'system.roles.create', state: 'Create', detail: null }],
  };
  let contract: BackendFeatureManifest;
  let fixture: ComponentFixture<FeatureRegistryPageComponent>;
  let preview: ReturnType<typeof vi.fn>;
  let manifest: ReturnType<typeof vi.fn>;
  let apply: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    contract = mockManifestForRoutes(await discoverExecutableSystemChildRoutes());
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

  it('loads manifest v2, preview and actual child route modules before enabling Apply', async () => {
    fixture.componentInstance.ngOnInit();
    expect(apply).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(fixture.componentInstance.manifestVerified()).toBe(true));
    expect(preview).toHaveBeenCalledOnce();
    expect(manifest).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.manifestProblems()).toEqual([]);
    expect(fixture.componentInstance.count('Create')).toBe(1);
  });

  it('requires explicit user confirmation even with matching nested routes', async () => {
    fixture.componentInstance.ngOnInit();
    await vi.waitFor(() => expect(fixture.componentInstance.manifestVerified()).toBe(true));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentInstance.applyChanges();
    expect(apply).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fixture.componentInstance.applyChanges();
    expect(apply).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(preview).toHaveBeenCalledTimes(2));
    expect(manifest).toHaveBeenCalledTimes(2);
  });

  it('blocks Apply when one declared nested page is absent from Backend', async () => {
    manifest.mockReturnValue(of({ ...contract,
      uiElements: contract.uiElements.filter(x => x.route !== '/system/roles/create') }));
    fixture.componentInstance.ngOnInit();
    await vi.waitFor(() => expect(fixture.componentInstance.manifestVerified()).toBe(true));
    expect(fixture.componentInstance.manifestProblems().join(' '))
      .toContain('/system/roles/create');

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.applyChanges();
    expect(apply).not.toHaveBeenCalled();
  });

  it('blocks Apply on preview conflict and clears stale state on 403', async () => {
    preview.mockReturnValueOnce(of({ canApply: false, hasPending: true,
      changes: [{ type: 'UiResource', key: 'system.roles.edit', state: 'Conflict', detail: null }] }));
    fixture.componentInstance.ngOnInit();
    await vi.waitFor(() => expect(fixture.componentInstance.manifestVerified()).toBe(true));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.applyChanges();
    expect(apply).not.toHaveBeenCalled();

    manifest.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    fixture.componentInstance.loadPreview();
    expect(fixture.componentInstance.preview()).toBeNull();
    expect(fixture.componentInstance.manifestVerified()).toBe(false);
    expect(fixture.componentInstance.error()).toContain('مجاز نیست');
  });

  it('blocks stale successful preview after 409 apply failure', async () => {
    fixture.componentInstance.ngOnInit();
    await vi.waitFor(() => expect(fixture.componentInstance.manifestVerified()).toBe(true));
    apply.mockReturnValue(throwError(() => ({ status: 409 })));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.applyChanges();
    expect(fixture.componentInstance.preview()).toBeNull();
    expect(fixture.componentInstance.error()).toContain('متوقف');
  });

  it('fails closed if an executable lazy child route cannot be loaded', async () => {
    manifest.mockReturnValue(throwError(() => ({ status: 404 })));
    fixture.componentInstance.ngOnInit();
    await vi.waitFor(() =>
      expect(fixture.componentInstance.error()).not.toBeNull());
    expect(fixture.componentInstance.manifestVerified()).toBe(false);
    expect(fixture.componentInstance.preview()).toBeNull();
    expect(apply).not.toHaveBeenCalled();
  });
});
