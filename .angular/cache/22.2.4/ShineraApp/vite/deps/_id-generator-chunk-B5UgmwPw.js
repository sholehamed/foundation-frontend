import { Cr as inject, y as APP_ID } from "./_resource-chunk-Bx4DDTyu.js";
import { Ai as setClassMetadata, Zn as Service, qa as ɵɵdefineService } from "./core-CvQoWPX1.js";
//#region node_modules/@angular/cdk/fesm2022/_fake-event-detection-chunk.mjs
function isFakeMousedownFromScreenReader(event) {
	return event.buttons === 0 || event.detail === 0;
}
function isFakeTouchstartFromScreenReader(event) {
	const touch = event.touches && event.touches[0] || event.changedTouches && event.changedTouches[0];
	return !!touch && touch.identifier === -1 && (touch.radiusX == null || touch.radiusX === 1) && (touch.radiusY == null || touch.radiusY === 1);
}
//#endregion
//#region node_modules/@angular/cdk/fesm2022/_shadow-dom-chunk.mjs
var shadowDomIsSupported;
function _supportsShadowDom() {
	if (shadowDomIsSupported == null) {
		const head = typeof document !== "undefined" ? document.head : null;
		shadowDomIsSupported = !!(head && (head.createShadowRoot || head.attachShadow));
	}
	return shadowDomIsSupported;
}
function _getShadowRoot(element) {
	if (_supportsShadowDom()) {
		const rootNode = element.getRootNode ? element.getRootNode() : null;
		if (typeof ShadowRoot !== "undefined" && ShadowRoot && rootNode instanceof ShadowRoot) return rootNode;
	}
	return null;
}
function _getFocusedElementPierceShadowDom() {
	let activeElement = typeof document !== "undefined" && document ? document.activeElement : null;
	while (activeElement && activeElement.shadowRoot) {
		const newActiveElement = activeElement.shadowRoot.activeElement;
		if (newActiveElement === activeElement) break;
		else activeElement = newActiveElement;
	}
	return activeElement;
}
function _getEventTarget(event) {
	if (event.composedPath) try {
		return event.composedPath()[0];
	} catch {}
	return event.target;
}
//#endregion
//#region node_modules/@angular/cdk/fesm2022/_id-generator-chunk.mjs
var counters = /* @__PURE__ */ new Map();
var _IdGenerator = class _IdGenerator {
	_appId = inject(APP_ID);
	static _infix = `a${Math.floor(Math.random() * 1e5).toString()}`;
	getId(prefix, randomize = false) {
		if (this._appId !== "ng") prefix += this._appId;
		let count = counters.get(prefix);
		if (count === void 0) count = 0;
		else count++;
		counters.set(prefix, count);
		return `${prefix}${randomize ? _IdGenerator._infix + "-" : ""}${count}`;
	}
	static ɵfac = function _IdGenerator_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || _IdGenerator)();
	};
	static ɵprov = /*@__PURE__*/ ɵɵdefineService({
		token: _IdGenerator,
		factory: _IdGenerator.ɵfac
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(_IdGenerator, [{ type: Service }], null, null);
})();
//#endregion
export { isFakeMousedownFromScreenReader as a, _getShadowRoot as i, _getEventTarget as n, isFakeTouchstartFromScreenReader as o, _getFocusedElementPierceShadowDom as r, _IdGenerator as t };
