import { la as ɵɵdefineInjector } from "./_resource-chunk-Bx4DDTyu.js";
import { Ai as setClassMetadata, Ga as ɵɵdefineNgModule, Nn as NgModule } from "./core-CvQoWPX1.js";
import { m as A11yModule } from "./a11y-BCACXYT9.js";
import { BidiModule } from "./@angular_cdk_bidi.js";
import { i as CdkScrollableModule } from "./scrolling-DbQiA4UX.js";
import "./_animation-chunk-r7YDfVjA.js";
import { s as OverlayModule } from "./overlay-5V4xsQnR.js";
import "./platform-QZypPzU1.js";
import "./portal-CySa4PCR.js";
import { a as TOOLTIP_PANEL_CLASS, i as SCROLL_THROTTLE_MS, n as MAT_TOOLTIP_SCROLL_STRATEGY, o as TooltipComponent, r as MatTooltip, s as getMatTooltipInvalidPositionError, t as MAT_TOOLTIP_DEFAULT_OPTIONS } from "./_tooltip-chunk-CHACsP1I.js";
//#region node_modules/@angular/material/fesm2022/tooltip.mjs
var MatTooltipModule = class MatTooltipModule {
	static ɵfac = function MatTooltipModule_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatTooltipModule)();
	};
	static ɵmod = /*@__PURE__*/ ɵɵdefineNgModule({
		type: MatTooltipModule,
		imports: [
			A11yModule,
			OverlayModule,
			MatTooltip,
			TooltipComponent
		],
		exports: [
			MatTooltip,
			TooltipComponent,
			BidiModule,
			CdkScrollableModule
		]
	});
	static ɵinj = /*@__PURE__*/ ɵɵdefineInjector({ imports: [
		A11yModule,
		OverlayModule,
		BidiModule,
		CdkScrollableModule
	] });
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTooltipModule, [{
		type: NgModule,
		args: [{
			imports: [
				A11yModule,
				OverlayModule,
				MatTooltip,
				TooltipComponent
			],
			exports: [
				MatTooltip,
				TooltipComponent,
				BidiModule,
				CdkScrollableModule
			]
		}]
	}], null, null);
})();
//#endregion
export { MAT_TOOLTIP_DEFAULT_OPTIONS, MAT_TOOLTIP_SCROLL_STRATEGY, MatTooltip, MatTooltipModule, SCROLL_THROTTLE_MS, TOOLTIP_PANEL_CLASS, TooltipComponent, getMatTooltipInvalidPositionError };
