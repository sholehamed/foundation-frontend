import { Injectable, signal, computed } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ToggleService {
    // وضعیت داخلی به صورت writable signal
    private readonly _isSidebarToggled = signal<boolean>(false);

    // فقط-خواندنی برای مصرف‌کننده‌ها
    readonly isSidebarToggled = this._isSidebarToggled.asReadonly();

    toggle(): void {
        this._isSidebarToggled.update(value => !value);
    }

    setSidebarState(state: boolean): void {
        this._isSidebarToggled.set(state);
    }
}
