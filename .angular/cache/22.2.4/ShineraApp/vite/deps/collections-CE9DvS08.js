import { Ai as setClassMetadata, Zn as Service, qa as ɵɵdefineService } from "./core-CvQoWPX1.js";
import { r as _ViewRepeaterOperation } from "./_recycle-view-repeater-strategy-chunk-QmIS2MRm.js";
//#region node_modules/@angular/cdk/fesm2022/_unique-selection-dispatcher-chunk.mjs
var UniqueSelectionDispatcher = class UniqueSelectionDispatcher {
	_listeners = [];
	notify(id, name) {
		for (let listener of this._listeners) listener(id, name);
	}
	listen(listener) {
		this._listeners.push(listener);
		return () => {
			this._listeners = this._listeners.filter((registered) => {
				return listener !== registered;
			});
		};
	}
	ngOnDestroy() {
		this._listeners = [];
	}
	static ɵfac = function UniqueSelectionDispatcher_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || UniqueSelectionDispatcher)();
	};
	static ɵprov = /*@__PURE__*/ ɵɵdefineService({
		token: UniqueSelectionDispatcher,
		factory: UniqueSelectionDispatcher.ɵfac
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UniqueSelectionDispatcher, [{ type: Service }], null, null);
})();
//#endregion
//#region node_modules/@angular/cdk/fesm2022/_dispose-view-repeater-strategy-chunk.mjs
var _DisposeViewRepeaterStrategy = class {
	applyChanges(changes, viewContainerRef, itemContextFactory, itemValueResolver, itemViewChanged) {
		changes.forEachOperation((record, adjustedPreviousIndex, currentIndex) => {
			let view;
			let operation;
			if (record.previousIndex == null) {
				const insertContext = itemContextFactory(record, adjustedPreviousIndex, currentIndex);
				view = viewContainerRef.createEmbeddedView(insertContext.templateRef, insertContext.context, insertContext.index);
				operation = _ViewRepeaterOperation.INSERTED;
			} else if (currentIndex == null) {
				viewContainerRef.remove(adjustedPreviousIndex);
				operation = _ViewRepeaterOperation.REMOVED;
			} else {
				view = viewContainerRef.get(adjustedPreviousIndex);
				viewContainerRef.move(view, currentIndex);
				operation = _ViewRepeaterOperation.MOVED;
			}
			if (itemViewChanged) itemViewChanged({
				context: view?.context,
				operation,
				record
			});
		});
	}
	detach() {}
};
//#endregion
export { UniqueSelectionDispatcher as n, _DisposeViewRepeaterStrategy as t };
