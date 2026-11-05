import { Cr as inject, I as EventEmitter, et as NgZone, la as ɵɵdefineInjector } from "./_resource-chunk-Bx4DDTyu.js";
import { Ai as setClassMetadata, Ga as ɵɵdefineNgModule, Nn as NgModule, O as booleanAttribute, Sn as Input, Wa as ɵɵdefineDirective, Zn as Service, fn as ElementRef, qa as ɵɵdefineService, un as Directive, zn as Output } from "./core-CvQoWPX1.js";
import { Ot as debounceTime, Qt as filter, Wn as Subject, Yn as Observable, fn as map } from "./zipWith-llrjS8GZ.js";
import { n as coerceElement, r as coerceNumberProperty } from "./_element-chunk-CsqxA4KF.js";
//#region node_modules/@angular/cdk/fesm2022/observers.mjs
function shouldIgnoreRecord(record) {
	if (record.type === "characterData" && record.target instanceof Comment) return true;
	if (record.type === "childList") {
		for (let i = 0; i < record.addedNodes.length; i++) if (!(record.addedNodes[i] instanceof Comment)) return false;
		for (let i = 0; i < record.removedNodes.length; i++) if (!(record.removedNodes[i] instanceof Comment)) return false;
		return true;
	}
	return false;
}
var MutationObserverFactory = class MutationObserverFactory {
	create(callback) {
		return typeof MutationObserver === "undefined" ? null : new MutationObserver(callback);
	}
	static ɵfac = function MutationObserverFactory_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MutationObserverFactory)();
	};
	static ɵprov = /*@__PURE__*/ ɵɵdefineService({
		token: MutationObserverFactory,
		factory: MutationObserverFactory.ɵfac
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MutationObserverFactory, [{ type: Service }], null, null);
})();
var ContentObserver = class ContentObserver {
	_mutationObserverFactory = inject(MutationObserverFactory);
	_observedElements = /* @__PURE__ */ new Map();
	_ngZone = inject(NgZone);
	ngOnDestroy() {
		this._observedElements.forEach((_, element) => this._cleanupObserver(element));
	}
	observe(elementOrRef) {
		const element = coerceElement(elementOrRef);
		return new Observable((observer) => {
			const subscription = this._observeElement(element).pipe(map((records) => records.filter((record) => !shouldIgnoreRecord(record))), filter((records) => !!records.length)).subscribe((records) => {
				this._ngZone.run(() => {
					observer.next(records);
				});
			});
			return () => {
				subscription.unsubscribe();
				this._unobserveElement(element);
			};
		});
	}
	_observeElement(element) {
		return this._ngZone.runOutsideAngular(() => {
			if (!this._observedElements.has(element)) {
				const stream = new Subject();
				const observer = this._mutationObserverFactory.create((mutations) => stream.next(mutations));
				if (observer) observer.observe(element, {
					characterData: true,
					childList: true,
					subtree: true
				});
				this._observedElements.set(element, {
					observer,
					stream,
					count: 1
				});
			} else this._observedElements.get(element).count++;
			return this._observedElements.get(element).stream;
		});
	}
	_unobserveElement(element) {
		if (this._observedElements.has(element)) {
			this._observedElements.get(element).count--;
			if (!this._observedElements.get(element).count) this._cleanupObserver(element);
		}
	}
	_cleanupObserver(element) {
		if (this._observedElements.has(element)) {
			const { observer, stream } = this._observedElements.get(element);
			if (observer) observer.disconnect();
			stream.complete();
			this._observedElements.delete(element);
		}
	}
	static ɵfac = function ContentObserver_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || ContentObserver)();
	};
	static ɵprov = /*@__PURE__*/ ɵɵdefineService({
		token: ContentObserver,
		factory: ContentObserver.ɵfac
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ContentObserver, [{ type: Service }], null, null);
})();
var CdkObserveContent = class CdkObserveContent {
	_contentObserver = inject(ContentObserver);
	_elementRef = inject(ElementRef);
	event = new EventEmitter();
	get disabled() {
		return this._disabled;
	}
	set disabled(value) {
		this._disabled = value;
		this._disabled ? this._unsubscribe() : this._subscribe();
	}
	_disabled = false;
	get debounce() {
		return this._debounce;
	}
	set debounce(value) {
		this._debounce = coerceNumberProperty(value);
		this._subscribe();
	}
	_debounce;
	_currentSubscription = null;
	ngAfterContentInit() {
		if (!this._currentSubscription && !this.disabled) this._subscribe();
	}
	ngOnDestroy() {
		this._unsubscribe();
	}
	_subscribe() {
		this._unsubscribe();
		const stream = this._contentObserver.observe(this._elementRef);
		this._currentSubscription = (this.debounce ? stream.pipe(debounceTime(this.debounce)) : stream).subscribe(this.event);
	}
	_unsubscribe() {
		this._currentSubscription?.unsubscribe();
	}
	static ɵfac = function CdkObserveContent_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || CdkObserveContent)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: CdkObserveContent,
		selectors: [[
			"",
			"cdkObserveContent",
			""
		]],
		inputs: {
			disabled: [
				2,
				"cdkObserveContentDisabled",
				"disabled",
				booleanAttribute
			],
			debounce: "debounce"
		},
		outputs: { event: "cdkObserveContent" },
		exportAs: ["cdkObserveContent"]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkObserveContent, [{
		type: Directive,
		args: [{
			selector: "[cdkObserveContent]",
			exportAs: "cdkObserveContent"
		}]
	}], null, {
		event: [{
			type: Output,
			args: ["cdkObserveContent"]
		}],
		disabled: [{
			type: Input,
			args: [{
				alias: "cdkObserveContentDisabled",
				transform: booleanAttribute
			}]
		}],
		debounce: [{ type: Input }]
	});
})();
var ObserversModule = class ObserversModule {
	static ɵfac = function ObserversModule_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || ObserversModule)();
	};
	static ɵmod = /*@__PURE__*/ ɵɵdefineNgModule({
		type: ObserversModule,
		imports: [CdkObserveContent],
		exports: [CdkObserveContent]
	});
	static ɵinj = /*@__PURE__*/ ɵɵdefineInjector({ providers: [MutationObserverFactory] });
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ObserversModule, [{
		type: NgModule,
		args: [{
			imports: [CdkObserveContent],
			exports: [CdkObserveContent],
			providers: [MutationObserverFactory]
		}]
	}], null, null);
})();
//#endregion
export { ContentObserver as n, ObserversModule as r, CdkObserveContent as t };
