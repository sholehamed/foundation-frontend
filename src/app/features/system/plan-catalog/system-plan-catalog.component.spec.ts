import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SystemPlanCatalogComponent } from './system-plan-catalog.component';
import { SystemPlanCatalogService } from './system-plan-catalog.service';

const emptyDraft = {
  id: 'draft-1', planId: 'plan-1', versionNumber: 1,
  planCode: 'starter', parentPlanVersionId: null,
  content: {
    displayTitle: 'Starter', displaySubtitle: null, badgeText: null,
    isRecommended: false, displayOrder: 0, moduleCodes: [],
    prices: [], capabilities: [], displayItems: [],
  },
};

describe('System Plan Catalog UI', () => {
  const api = {
    list: () => of([]),
    commercialModules: () => of([]),
    readDraft: () => of(emptyDraft),
    preview: () => of({
      versionId: 'draft-1', versionNumber: 1, fingerprint: 'a'.repeat(64),
      canPublish: false, issues: ['no_commercial_module'],
      effectiveModuleCodes: [],
    }),
  };

  async function create(planRows: unknown[] = []) {
    await TestBed.configureTestingModule({
      imports: [SystemPlanCatalogComponent],
      providers: [{ provide: SystemPlanCatalogService, useValue: {
        ...api, list: () => of(planRows),
      } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(SystemPlanCatalogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders an empty catalog and offers central draft creation', async () => {
    const fixture = await create();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('هنوز پلنی تعریف نشده');
    expect(page.textContent).toContain('ایجاد نسخه پیش‌نویس');
    expect(page.textContent).not.toContain('اشتراک فعال شد');
  });

  it('marks a published version as locked and offers only a new draft revision', async () => {
    const fixture = await create([{
      id: 'plan-1', code: 'starter', name: 'Starter',
      isActive: true, parentPlanId: null, draftVersionId: null,
      latestVersionNumber: 2, latestVersionStatus: 'Published',
      publishedVersions: 2, latestPublishedVersionId: 'version-2',
    }]);
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('نسخه منتشرشده قفل است');
    const buttons = [...page.querySelectorAll('button')]
      .map(x => x.textContent?.trim());
    expect(buttons).toContain('نسخه جدید');
    expect(buttons).not.toContain('ویرایش پیش‌نویس');
    expect(page.textContent).not.toContain('اشتراک فعال شد');
  });

  it('refuses to enable Publish when source registry has zero Commercial modules', async () => {
    const fixture = await create();
    fixture.componentInstance.openDraft('draft-1');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('هنوز هیچ ماژول تجاری تاییدشده‌ای ثبت نشده');

    fixture.componentInstance.review();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('no_commercial_module');
    const publish = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')]
      .find(x => x.textContent?.includes('انتشار نسخه تأییدشده'));
    expect(publish).toBeDefined();
    expect(publish?.disabled).toBe(true);
  });
});
