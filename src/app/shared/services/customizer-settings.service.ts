import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CustomizerSettingsService {// یک helper برای ساخت signal با پشتیبانی از localStorage
    private persistedSignal(key: string, defaultValue = false) {
        const stored = this.isBrowser()
            ? JSON.parse(localStorage.getItem(key)!) ?? defaultValue
            : defaultValue;
        return signal<boolean>(stored);
    }

    // ─── Signals ───────────────────────────────────────────────
    readonly isDarkTheme             = this.persistedSignal('isDarkTheme', false);
    readonly isSidebarDarkTheme      = this.persistedSignal('isSidebarDarkTheme');
    readonly isRightSidebarTheme     = this.persistedSignal('isRightSidebarTheme');
    readonly isHideSidebarTheme      = this.persistedSignal('isHideSidebarTheme');
    readonly isHeaderDarkTheme       = this.persistedSignal('isHeaderDarkTheme');
    readonly isCardBorderedTheme     = this.persistedSignal('isCardBorderedTheme');
    readonly isNavbarTheme           = this.persistedSignal('isNavbarTheme');
    readonly isCardWithoutBorderRadiusTheme = this.persistedSignal('isCardWithoutBorderRadiusTheme');
    readonly isCardWithBoxShadowTheme       = this.persistedSignal('isCardWithBoxShadowTheme');
    readonly isRTLEnabledTheme       = this.persistedSignal('isRTLEnabledTheme', false);
    readonly isBodyBGTheme           = this.persistedSignal('isBodyBGTheme', false);

    // Toggle sidebar/navbar (جایگزین isToggled قبلی — نام واضح‌تر)
    readonly isNavbarToggled         = signal<boolean>(false);

    constructor() {
        if (!this.isBrowser()) return;

        // sync هر تغییر به localStorage و DOM به صورت خودکار
        effect(() => {
            localStorage.setItem('isDarkTheme', JSON.stringify(this.isDarkTheme()));
            document.body.classList.toggle('dark-theme', this.isDarkTheme());});
            // document.body.classList.toggle('dark-theme', false);});

        effect(() => {
            localStorage.setItem('isSidebarDarkTheme', JSON.stringify(this.isSidebarDarkTheme()));
        });
        effect(() => {
            localStorage.setItem('isRightSidebarTheme', JSON.stringify(this.isRightSidebarTheme()));
        });
        effect(() => {
            localStorage.setItem('isHideSidebarTheme', JSON.stringify(this.isHideSidebarTheme()));
        });
        effect(() => {
            localStorage.setItem('isHeaderDarkTheme', JSON.stringify(this.isHeaderDarkTheme()));
        });
        effect(() => {
            localStorage.setItem('isCardBorderedTheme', JSON.stringify(this.isCardBorderedTheme()));
        });
        effect(() => {
            localStorage.setItem('isNavbarTheme', JSON.stringify(this.isNavbarTheme()));
        });
        effect(() => {
            localStorage.setItem('isCardWithoutBorderRadiusTheme', JSON.stringify(this.isCardWithoutBorderRadiusTheme()));
        });
        effect(() => {
            localStorage.setItem('isCardWithBoxShadowTheme', JSON.stringify(this.isCardWithBoxShadowTheme()));
        });
        effect(() => {
            localStorage.setItem('isRTLEnabledTheme', JSON.stringify(this.isRTLEnabledTheme()));
            document.body.classList.toggle('rtl-enabled', this.isRTLEnabledTheme());
        });
        effect(() => {
            localStorage.setItem('isBodyBGTheme', JSON.stringify(this.isBodyBGTheme()));
            document.body.classList.toggle('body-bg-color', this.isBodyBGTheme());
        });
    }

    // ─── Toggle Methods ────────────────────────────────────────
    toggleTheme()                    { this.isDarkTheme.update(v => !v); }
    toggleSidebarTheme()             { this.isSidebarDarkTheme.update(v => !v); }
    toggleRightSidebarTheme()        { this.isRightSidebarTheme.update(v => !v); }
    toggleHideSidebarTheme()         { this.isHideSidebarTheme.update(v => !v); }
    toggleHeaderTheme()              { this.isHeaderDarkTheme.update(v => !v); }
    toggleCardBorderedTheme()        { this.isCardBorderedTheme.update(v => !v); }
    toggleNavbarTheme()              { this.isNavbarTheme.update(v => !v); }
    toggleCardWithoutBorderRadiusTheme() { this.isCardWithoutBorderRadiusTheme.update(v => !v); }
    toggleCardWithBoxShadowTheme()   { this.isCardWithBoxShadowTheme.update(v => !v); }
    toggleRTLEnabledTheme()          { this.isRTLEnabledTheme.update(v => !v); }
    toggleBodyBGTheme()              { this.isBodyBGTheme.update(v => !v); }
    toggle()                         { this.isNavbarToggled.update(v => !v); }

    // ─── Private ───────────────────────────────────────────────
    private isBrowser(): boolean {
        return typeof window !== 'undefined';
    }
}
