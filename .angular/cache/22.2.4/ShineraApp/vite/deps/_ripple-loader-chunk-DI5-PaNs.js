import { Cr as inject, T as DOCUMENT, W as Injector, et as NgZone } from "./_resource-chunk-Bx4DDTyu.js";
import { Ai as setClassMetadata, Gn as RendererFactory2, Zn as Service, qa as ɵɵdefineService } from "./core-CvQoWPX1.js";
import { n as _getEventTarget } from "./_id-generator-chunk-B5UgmwPw.js";
import { t as Platform } from "./_platform-chunk-C5KSvbhh.js";
import { n as _animationsDisabled } from "./_animation-chunk-r7YDfVjA.js";
import "./platform-QZypPzU1.js";
import { i as RippleRenderer, o as defaultRippleAnimationConfig, t as MAT_RIPPLE_GLOBAL_OPTIONS } from "./_ripple-chunk-eObiRiyD.js";
//#region node_modules/@angular/material/fesm2022/_ripple-loader-chunk.mjs
var eventListenerOptions = { capture: true };
var rippleInteractionEvents = [
	"focus",
	"mousedown",
	"mouseenter",
	"touchstart"
];
var matRippleUninitialized = "mat-ripple-loader-uninitialized";
var matRippleClassName = "mat-ripple-loader-class-name";
var matRippleCentered = "mat-ripple-loader-centered";
var matRippleDisabled = "mat-ripple-loader-disabled";
var MatRippleLoader = class MatRippleLoader {
	_document = inject(DOCUMENT);
	_animationsDisabled = _animationsDisabled();
	_globalRippleOptions = inject(MAT_RIPPLE_GLOBAL_OPTIONS, { optional: true });
	_platform = inject(Platform);
	_ngZone = inject(NgZone);
	_injector = inject(Injector);
	_eventCleanups;
	_hosts = /* @__PURE__ */ new Map();
	constructor() {
		const renderer = inject(RendererFactory2).createRenderer(null, null);
		this._eventCleanups = this._ngZone.runOutsideAngular(() => rippleInteractionEvents.map((name) => renderer.listen(this._document, name, this._onInteraction, eventListenerOptions)));
	}
	ngOnDestroy() {
		const hosts = this._hosts.keys();
		for (const host of hosts) this.destroyRipple(host);
		this._eventCleanups.forEach((cleanup) => cleanup());
	}
	configureRipple(host, config) {
		host.setAttribute(matRippleUninitialized, this._globalRippleOptions?.namespace ?? "");
		if (config.className || !host.hasAttribute(matRippleClassName)) host.setAttribute(matRippleClassName, config.className || "");
		if (config.centered) host.setAttribute(matRippleCentered, "");
		if (config.disabled) host.setAttribute(matRippleDisabled, "");
	}
	setDisabled(host, disabled) {
		const ripple = this._hosts.get(host);
		if (ripple) {
			ripple.target.rippleDisabled = disabled;
			if (!disabled && !ripple.hasSetUpEvents) {
				ripple.hasSetUpEvents = true;
				ripple.renderer.setupTriggerEvents(host);
			}
		} else if (disabled) host.setAttribute(matRippleDisabled, "");
		else host.removeAttribute(matRippleDisabled);
	}
	_onInteraction = (event) => {
		const eventTarget = _getEventTarget(event);
		if (eventTarget instanceof HTMLElement) {
			const element = eventTarget.closest(`[${matRippleUninitialized}="${this._globalRippleOptions?.namespace ?? ""}"]`);
			if (element) this._createRipple(element);
		}
	};
	_createRipple(host) {
		if (!this._document || this._hosts.has(host)) return;
		host.querySelector(".mat-ripple")?.remove();
		const rippleEl = this._document.createElement("span");
		rippleEl.classList.add("mat-ripple", host.getAttribute(matRippleClassName));
		host.append(rippleEl);
		const globalOptions = this._globalRippleOptions;
		const enterDuration = this._animationsDisabled ? 0 : globalOptions?.animation?.enterDuration ?? defaultRippleAnimationConfig.enterDuration;
		const exitDuration = this._animationsDisabled ? 0 : globalOptions?.animation?.exitDuration ?? defaultRippleAnimationConfig.exitDuration;
		const target = {
			rippleDisabled: this._animationsDisabled || globalOptions?.disabled || host.hasAttribute(matRippleDisabled),
			rippleConfig: {
				centered: host.hasAttribute(matRippleCentered),
				terminateOnPointerUp: globalOptions?.terminateOnPointerUp,
				animation: {
					enterDuration,
					exitDuration
				}
			}
		};
		const renderer = new RippleRenderer(target, this._ngZone, rippleEl, this._platform, this._injector);
		const hasSetUpEvents = !target.rippleDisabled;
		if (hasSetUpEvents) renderer.setupTriggerEvents(host);
		this._hosts.set(host, {
			target,
			renderer,
			hasSetUpEvents
		});
		host.removeAttribute(matRippleUninitialized);
	}
	destroyRipple(host) {
		const ripple = this._hosts.get(host);
		if (ripple) {
			ripple.renderer._removeTriggerEvents();
			this._hosts.delete(host);
		}
	}
	static ɵfac = function MatRippleLoader_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatRippleLoader)();
	};
	static ɵprov = /*@__PURE__*/ ɵɵdefineService({
		token: MatRippleLoader,
		factory: MatRippleLoader.ɵfac
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatRippleLoader, [{ type: Service }], () => [], null);
})();
//#endregion
export { MatRippleLoader as t };
