import { Hi as signal, I as EventEmitter, la as ɵɵdefineInjector } from "./_resource-chunk-Bx4DDTyu.js";
import { Ai as setClassMetadata, Ga as ɵɵdefineNgModule, Nn as NgModule, Sn as Input, Wa as ɵɵdefineDirective, Xi as ɵɵProvidersFeature, aa as ɵɵattribute, un as Directive, zn as Output } from "./core-CvQoWPX1.js";
import { n as Directionality, r as _resolveDirectionality, t as DIR_DOCUMENT } from "./_directionality-chunk-vYg-12nF.js";
//#region node_modules/@angular/cdk/fesm2022/bidi.mjs
var Dir = class Dir {
	_isInitialized = false;
	_rawDir = "";
	change = new EventEmitter();
	get dir() {
		return this.valueSignal();
	}
	set dir(value) {
		const previousValue = this.valueSignal();
		this.valueSignal.set(_resolveDirectionality(value));
		this._rawDir = value;
		if (previousValue !== this.valueSignal() && this._isInitialized) this.change.emit(this.valueSignal());
	}
	get value() {
		return this.dir;
	}
	valueSignal = signal("ltr", ...ngDevMode ? [{ debugName: "valueSignal" }] : []);
	ngAfterContentInit() {
		this._isInitialized = true;
	}
	ngOnDestroy() {
		this.change.complete();
	}
	static ɵfac = function Dir_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || Dir)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: Dir,
		selectors: [[
			"",
			"dir",
			""
		]],
		hostVars: 1,
		hostBindings: function Dir_HostBindings(rf, ctx) {
			if (rf & 2) ɵɵattribute("dir", ctx._rawDir);
		},
		inputs: { dir: "dir" },
		outputs: { change: "dirChange" },
		exportAs: ["dir"],
		features: [ɵɵProvidersFeature([{
			provide: Directionality,
			useExisting: Dir
		}])]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Dir, [{
		type: Directive,
		args: [{
			selector: "[dir]",
			providers: [{
				provide: Directionality,
				useExisting: Dir
			}],
			host: { "[attr.dir]": "_rawDir" },
			exportAs: "dir"
		}]
	}], null, {
		change: [{
			type: Output,
			args: ["dirChange"]
		}],
		dir: [{ type: Input }]
	});
})();
var BidiModule = class BidiModule {
	static ɵfac = function BidiModule_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || BidiModule)();
	};
	static ɵmod = /*@__PURE__*/ ɵɵdefineNgModule({
		type: BidiModule,
		imports: [Dir],
		exports: [Dir]
	});
	static ɵinj = /*@__PURE__*/ ɵɵdefineInjector({});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BidiModule, [{
		type: NgModule,
		args: [{
			imports: [Dir],
			exports: [Dir]
		}]
	}], null, null);
})();
//#endregion
export { BidiModule, DIR_DOCUMENT, Dir, Directionality };
