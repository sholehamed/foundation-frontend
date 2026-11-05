import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OverviewPage } from './overview.page';

describe('OverviewPage', () => {
  it('introduces the foundation starter', async () => {
    await TestBed.configureTestingModule({ imports: [OverviewPage] }).compileComponents();
    const fixture = TestBed.createComponent(OverviewPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('A clean starting point');
  });
});
