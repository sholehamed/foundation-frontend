import { Cr as inject, Hi as signal, I as EventEmitter, T as DOCUMENT, U as InjectionToken } from "./_resource-chunk-Bx4DDTyu.js";
import { Ai as setClassMetadata, Zn as Service, qa as ɵɵdefineService } from "./core-CvQoWPX1.js";
//#region node_modules/@angular/cdk/fesm2022/_directionality-chunk.mjs
var DIR_DOCUMENT = new InjectionToken("cdk-dir-doc", {
	providedIn: "root",
	factory: () => inject(DOCUMENT)
});
var RTL_LOCALE_PATTERN = /^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|.*[-_](Adlm|Arab|Hebr|Nkoo|Rohg|Thaa))(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)/i;
function _resolveDirectionality(rawValue) {
	const value = rawValue?.toLowerCase() || "";
	if (value === "auto" && typeof navigator !== "undefined" && navigator?.language) return RTL_LOCALE_PATTERN.test(navigator.language) ? "rtl" : "ltr";
	return value === "rtl" ? "rtl" : "ltr";
}
var Directionality = class Directionality {
	get value() {
		return this.valueSignal();
	}
	valueSignal = signal("ltr", ...ngDevMode ? [{ debugName: "valueSignal" }] : []);
	change = new EventEmitter();
	constructor() {
		const _document = inject(DIR_DOCUMENT, { optional: true });
		if (_document) {
			const bodyDir = _document.body ? _document.body.dir : null;
			const htmlDir = _document.documentElement ? _document.documentElement.dir : null;
			this.valueSignal.set(_resolveDirectionality(bodyDir || htmlDir || "ltr"));
		}
	}
	ngOnDestroy() {
		this.change.complete();
	}
	static ɵfac = function Directionality_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || Directionality)();
	};
	static ɵprov = /*@__PURE__*/ ɵɵdefineService({
		token: Directionality,
		factory: Directionality.ɵfac
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Directionality, [{ type: Service }], () => [], null);
})();
//#endregion
export { Directionality as n, _resolveDirectionality as r, DIR_DOCUMENT as t };
