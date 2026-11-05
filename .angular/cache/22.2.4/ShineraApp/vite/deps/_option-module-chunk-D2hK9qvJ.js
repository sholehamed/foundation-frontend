import { Cr as inject, Hi as signal, I as EventEmitter, U as InjectionToken, la as ɵɵdefineInjector, qr as isSignal } from "./_resource-chunk-Bx4DDTyu.js";
import { $a as ɵɵdomElementEnd, Ai as setClassMetadata, Bo as ɵɵnextContext, Fs as ɵɵtextInterpolate1, Ga as ɵɵdefineNgModule, Jo as ɵɵprojectionDef, Jt as Component, Nn as NgModule, Ns as ɵɵtext, O as booleanAttribute, Ro as ɵɵlistener, S as ViewChild, Sn as Input, Ua as ɵɵdefineComponent, Xi as ɵɵProvidersFeature, Xs as ɵɵviewQuery, Yo as ɵɵproperty, Zi as ɵɵadvance, aa as ɵɵattribute, co as ɵɵelementEnd, da as ɵɵconditional, eo as ɵɵdomElementStart, fn as ElementRef, io as ɵɵelement, la as ɵɵclassProp, lo as ɵɵelementStart, no as ɵɵdomProperty, pa as ɵɵconditionalCreate, pr as ViewEncapsulation, qo as ɵɵprojection, r as ChangeDetectorRef, ss as ɵɵqueryRefresh, zn as Output, zo as ɵɵloadQuery } from "./core-CvQoWPX1.js";
import { Wn as Subject } from "./zipWith-llrjS8GZ.js";
import { t as _IdGenerator } from "./_id-generator-chunk-B5UgmwPw.js";
import "./_keycodes-chunk-DyiW0FjU.js";
import { t as _CdkPrivateStyleLoader } from "./_style-loader-chunk-DFYtcLqU.js";
import { t as _VisuallyHiddenLoader } from "./private-COGd-xwW.js";
import { hasModifierKey } from "./@angular_cdk_keycodes.js";
import { BidiModule } from "./@angular_cdk_bidi.js";
import { n as MatRipple } from "./_ripple-chunk-eObiRiyD.js";
import { n as MatPseudoCheckbox, t as MatPseudoCheckboxModule } from "./_pseudo-checkbox-module-chunk-ChDxZibE.js";
import { t as _StructuralStylesLoader } from "./_structural-styles-chunk-DNxUHw88.js";
import { t as MatRippleModule } from "./_ripple-module-chunk-DKUbo8w0.js";
//#region node_modules/@angular/material/fesm2022/_option-chunk.mjs
var MAT_OPTION_PARENT_COMPONENT = new InjectionToken("MAT_OPTION_PARENT_COMPONENT");
var MAT_OPTGROUP = new InjectionToken("MatOptgroup");
var MatOptgroup = class MatOptgroup {
	label;
	disabled = false;
	_labelId = inject(_IdGenerator).getId("mat-optgroup-label-");
	_inert;
	constructor() {
		const parent = inject(MAT_OPTION_PARENT_COMPONENT, { optional: true });
		this._inert = parent?.inertGroups ?? false;
	}
	static ɵfac = function MatOptgroup_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatOptgroup)();
	};
	static ɵcmp = (function() {
		const _c0 = ["*", [["mat-option"], ["ng-container"]]];
		return /*@__PURE__*/ ɵɵdefineComponent({
			type: MatOptgroup,
			selectors: [["mat-optgroup"]],
			hostAttrs: [1, "mat-mdc-optgroup"],
			hostVars: 3,
			hostBindings: function MatOptgroup_HostBindings(rf, ctx) {
				if (rf & 2) ɵɵattribute("role", ctx._inert ? null : "group")("aria-disabled", ctx._inert ? null : ctx.disabled.toString())("aria-labelledby", ctx._inert ? null : ctx._labelId);
			},
			inputs: {
				label: "label",
				disabled: [
					2,
					"disabled",
					"disabled",
					booleanAttribute
				]
			},
			exportAs: ["matOptgroup"],
			features: [ɵɵProvidersFeature([{
				provide: MAT_OPTGROUP,
				useExisting: MatOptgroup
			}])],
			ngContentSelectors: ["*", "mat-option, ng-container"],
			decls: 5,
			vars: 4,
			consts: [[
				"role",
				"presentation",
				1,
				"mat-mdc-optgroup-label",
				3,
				"id"
			], [1, "mdc-list-item__primary-text"]],
			template: function MatOptgroup_Template(rf, ctx) {
				if (rf & 1) {
					ɵɵprojectionDef(_c0);
					ɵɵdomElementStart(0, "span", 0)(1, "span", 1);
					ɵɵtext(2);
					ɵɵprojection(3);
					ɵɵdomElementEnd()();
					ɵɵprojection(4, 1);
				}
				if (rf & 2) {
					ɵɵclassProp("mdc-list-item--disabled", ctx.disabled);
					ɵɵdomProperty("id", ctx._labelId);
					ɵɵadvance(2);
					ɵɵtextInterpolate1("", ctx.label, " ");
				}
			},
			styles: [".mat-mdc-optgroup {\n  color: var(--%NS%mat-optgroup-label-text-color, var(--%NS%mat-sys-on-surface-variant));\n  font-family: var(--%NS%mat-optgroup-label-text-font, var(--%NS%mat-sys-title-small-font));\n  line-height: var(--%NS%mat-optgroup-label-text-line-height, var(--%NS%mat-sys-title-small-line-height));\n  font-size: var(--%NS%mat-optgroup-label-text-size, var(--%NS%mat-sys-title-small-size));\n  letter-spacing: var(--%NS%mat-optgroup-label-text-tracking, var(--%NS%mat-sys-title-small-tracking));\n  font-weight: var(--%NS%mat-optgroup-label-text-weight, var(--%NS%mat-sys-title-small-weight));\n}\n\n.mat-mdc-optgroup-label {\n  display: flex;\n  position: relative;\n  align-items: center;\n  justify-content: flex-start;\n  overflow: hidden;\n  min-height: 48px;\n  padding: 0 16px;\n  outline: none;\n}\n.mat-mdc-optgroup-label.mdc-list-item--disabled {\n  opacity: 0.38;\n}\n.mat-mdc-optgroup-label .mdc-list-item__primary-text {\n  font-size: inherit;\n  font-weight: inherit;\n  letter-spacing: inherit;\n  line-height: inherit;\n  font-family: inherit;\n  text-decoration: inherit;\n  text-transform: inherit;\n  white-space: normal;\n  color: inherit;\n}\n"],
			encapsulation: 2
		});
	})();
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatOptgroup, [{
		type: Component,
		args: [{
			selector: "mat-optgroup",
			exportAs: "matOptgroup",
			encapsulation: ViewEncapsulation.None,
			host: {
				"class": "mat-mdc-optgroup",
				"[attr.role]": "_inert ? null : \"group\"",
				"[attr.aria-disabled]": "_inert ? null : disabled.toString()",
				"[attr.aria-labelledby]": "_inert ? null : _labelId"
			},
			providers: [{
				provide: MAT_OPTGROUP,
				useExisting: MatOptgroup
			}],
			template: "<span\n  class=\"mat-mdc-optgroup-label\"\n  role=\"presentation\"\n  [class.mdc-list-item--disabled]=\"disabled\"\n  [id]=\"_labelId\">\n  <span class=\"mdc-list-item__primary-text\">{{ label }} <ng-content></ng-content></span>\n</span>\n\n<ng-content select=\"mat-option, ng-container\"></ng-content>\n",
			styles: [".mat-mdc-optgroup {\n  color: var(--mat-optgroup-label-text-color, var(--mat-sys-on-surface-variant));\n  font-family: var(--mat-optgroup-label-text-font, var(--mat-sys-title-small-font));\n  line-height: var(--mat-optgroup-label-text-line-height, var(--mat-sys-title-small-line-height));\n  font-size: var(--mat-optgroup-label-text-size, var(--mat-sys-title-small-size));\n  letter-spacing: var(--mat-optgroup-label-text-tracking, var(--mat-sys-title-small-tracking));\n  font-weight: var(--mat-optgroup-label-text-weight, var(--mat-sys-title-small-weight));\n}\n\n.mat-mdc-optgroup-label {\n  display: flex;\n  position: relative;\n  align-items: center;\n  justify-content: flex-start;\n  overflow: hidden;\n  min-height: 48px;\n  padding: 0 16px;\n  outline: none;\n}\n.mat-mdc-optgroup-label.mdc-list-item--disabled {\n  opacity: 0.38;\n}\n.mat-mdc-optgroup-label .mdc-list-item__primary-text {\n  font-size: inherit;\n  font-weight: inherit;\n  letter-spacing: inherit;\n  line-height: inherit;\n  font-family: inherit;\n  text-decoration: inherit;\n  text-transform: inherit;\n  white-space: normal;\n  color: inherit;\n}\n"]
		}]
	}], () => [], {
		label: [{ type: Input }],
		disabled: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}]
	});
})();
var MatOptionSelectionChange = class {
	source;
	isUserInput;
	constructor(source, isUserInput = false) {
		this.source = source;
		this.isUserInput = isUserInput;
	}
};
var MatOption = class MatOption {
	_element = inject(ElementRef);
	_changeDetectorRef = inject(ChangeDetectorRef);
	_parent = inject(MAT_OPTION_PARENT_COMPONENT, { optional: true });
	group = inject(MAT_OPTGROUP, { optional: true });
	_signalDisableRipple = false;
	_selected = false;
	_active = false;
	_mostRecentViewValue = "";
	get multiple() {
		return this._parent && this._parent.multiple;
	}
	get selected() {
		return this._selected;
	}
	value;
	id = inject(_IdGenerator).getId("mat-option-");
	get disabled() {
		return this.group && this.group.disabled || this._disabled();
	}
	set disabled(value) {
		this._disabled.set(value);
	}
	_disabled = signal(false, ...ngDevMode ? [{ debugName: "_disabled" }] : []);
	get disableRipple() {
		return this._signalDisableRipple ? this._parent.disableRipple() : !!this._parent?.disableRipple;
	}
	get hideSingleSelectionIndicator() {
		return !!(this._parent && this._parent.hideSingleSelectionIndicator);
	}
	onSelectionChange = new EventEmitter();
	_text;
	_stateChanges = new Subject();
	constructor() {
		const styleLoader = inject(_CdkPrivateStyleLoader);
		styleLoader.load(_StructuralStylesLoader);
		styleLoader.load(_VisuallyHiddenLoader);
		this._signalDisableRipple = !!this._parent && isSignal(this._parent.disableRipple);
	}
	get active() {
		return this._active;
	}
	get viewValue() {
		return (this._text?.nativeElement.textContent || "").trim();
	}
	select(emitEvent = true) {
		if (!this._selected) {
			this._selected = true;
			this._changeDetectorRef.markForCheck();
			if (emitEvent) this._emitSelectionChangeEvent();
		}
	}
	deselect(emitEvent = true) {
		if (this._selected) {
			this._selected = false;
			this._changeDetectorRef.markForCheck();
			if (emitEvent) this._emitSelectionChangeEvent();
		}
	}
	focus(_origin, options) {
		const element = this._getHostElement();
		if (typeof element.focus === "function") element.focus(options);
	}
	setActiveStyles() {
		if (!this._active) {
			this._active = true;
			this._changeDetectorRef.markForCheck();
		}
	}
	setInactiveStyles() {
		if (this._active) {
			this._active = false;
			this._changeDetectorRef.markForCheck();
		}
	}
	getLabel() {
		return this.viewValue;
	}
	_handleKeydown(event) {
		if ((event.keyCode === 13 || event.keyCode === 32) && !hasModifierKey(event)) {
			this._selectViaInteraction();
			event.preventDefault();
		}
	}
	_selectViaInteraction() {
		if (!this.disabled) {
			this._selected = this.multiple ? !this._selected : true;
			this._changeDetectorRef.markForCheck();
			this._emitSelectionChangeEvent(true);
		}
	}
	_getTabIndex() {
		return this.disabled ? "-1" : "0";
	}
	_getHostElement() {
		return this._element.nativeElement;
	}
	ngAfterViewChecked() {
		if (this._selected) {
			const viewValue = this.viewValue;
			if (viewValue !== this._mostRecentViewValue) {
				if (this._mostRecentViewValue) this._stateChanges.next();
				this._mostRecentViewValue = viewValue;
			}
		}
	}
	ngOnDestroy() {
		this._stateChanges.complete();
	}
	_emitSelectionChangeEvent(isUserInput = false) {
		this.onSelectionChange.emit(new MatOptionSelectionChange(this, isUserInput));
	}
	static ɵfac = function MatOption_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatOption)();
	};
	static ɵcmp = (function() {
		const _c0 = ["text"];
		const _c1 = [[["mat-icon"]], "*"];
		const _c2 = ["mat-icon", "*"];
		function MatOption_Conditional_0_Template(rf, ctx) {
			if (rf & 1) ɵɵelement(0, "mat-pseudo-checkbox", 1);
			if (rf & 2) {
				const ctx_r0 = ɵɵnextContext();
				ɵɵproperty("disabled", ctx_r0.disabled)("state", ctx_r0.selected ? "checked" : "unchecked");
			}
		}
		function MatOption_Conditional_5_Template(rf, ctx) {
			if (rf & 1) ɵɵelement(0, "mat-pseudo-checkbox", 3);
			if (rf & 2) {
				const ctx_r0 = ɵɵnextContext();
				ɵɵproperty("disabled", ctx_r0.disabled);
			}
		}
		function MatOption_Conditional_6_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵelementStart(0, "span", 4);
				ɵɵtext(1);
				ɵɵelementEnd();
			}
			if (rf & 2) {
				const ctx_r0 = ɵɵnextContext();
				ɵɵadvance();
				ɵɵtextInterpolate1("(", ctx_r0.group.label, ")");
			}
		}
		return /*@__PURE__*/ ɵɵdefineComponent({
			type: MatOption,
			selectors: [["mat-option"]],
			viewQuery: function MatOption_Query(rf, ctx) {
				if (rf & 1) ɵɵviewQuery(_c0, 7);
				if (rf & 2) {
					let _t = void 0;
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._text = _t.first);
				}
			},
			hostAttrs: [
				"role",
				"option",
				1,
				"mat-mdc-option",
				"mdc-list-item"
			],
			hostVars: 11,
			hostBindings: function MatOption_HostBindings(rf, ctx) {
				if (rf & 1) ɵɵlistener("click", function MatOption_click_HostBindingHandler() {
					return ctx._selectViaInteraction();
				})("keydown", function MatOption_keydown_HostBindingHandler($event) {
					return ctx._handleKeydown($event);
				});
				if (rf & 2) {
					ɵɵdomProperty("id", ctx.id);
					ɵɵattribute("aria-selected", ctx.selected)("aria-disabled", ctx.disabled.toString());
					ɵɵclassProp("mdc-list-item--selected", ctx.selected)("mat-mdc-option-multiple", ctx.multiple)("mat-mdc-option-active", ctx.active)("mdc-list-item--disabled", ctx.disabled);
				}
			},
			inputs: {
				value: "value",
				id: "id",
				disabled: [
					2,
					"disabled",
					"disabled",
					booleanAttribute
				]
			},
			outputs: { onSelectionChange: "onSelectionChange" },
			exportAs: ["matOption"],
			ngContentSelectors: _c2,
			decls: 8,
			vars: 5,
			consts: [
				["text", ""],
				[
					"aria-hidden",
					"true",
					1,
					"mat-mdc-option-pseudo-checkbox",
					3,
					"disabled",
					"state"
				],
				[1, "mdc-list-item__primary-text"],
				[
					"state",
					"checked",
					"aria-hidden",
					"true",
					"appearance",
					"minimal",
					1,
					"mat-mdc-option-pseudo-checkbox",
					3,
					"disabled"
				],
				[1, "cdk-visually-hidden"],
				[
					"aria-hidden",
					"true",
					"mat-ripple",
					"",
					1,
					"mat-mdc-option-ripple",
					"mat-focus-indicator",
					3,
					"matRippleTrigger",
					"matRippleDisabled"
				]
			],
			template: function MatOption_Template(rf, ctx) {
				if (rf & 1) {
					ɵɵprojectionDef(_c1);
					ɵɵconditionalCreate(0, MatOption_Conditional_0_Template, 1, 2, "mat-pseudo-checkbox", 1);
					ɵɵprojection(1);
					ɵɵelementStart(2, "span", 2, 0);
					ɵɵprojection(4, 1);
					ɵɵelementEnd();
					ɵɵconditionalCreate(5, MatOption_Conditional_5_Template, 1, 1, "mat-pseudo-checkbox", 3);
					ɵɵconditionalCreate(6, MatOption_Conditional_6_Template, 2, 1, "span", 4);
					ɵɵelement(7, "div", 5);
				}
				if (rf & 2) {
					ɵɵconditional(ctx.multiple ? 0 : -1);
					ɵɵadvance(5);
					ɵɵconditional(!ctx.multiple && ctx.selected && !ctx.hideSingleSelectionIndicator ? 5 : -1);
					ɵɵadvance();
					ɵɵconditional(ctx.group && ctx.group._inert ? 6 : -1);
					ɵɵadvance();
					ɵɵproperty("matRippleTrigger", ctx._getHostElement())("matRippleDisabled", ctx.disabled || ctx.disableRipple);
				}
			},
			dependencies: [MatPseudoCheckbox, MatRipple],
			styles: [".mat-mdc-option {\n  -webkit-user-select: none;\n  user-select: none;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  display: flex;\n  position: relative;\n  align-items: center;\n  justify-content: flex-start;\n  overflow: hidden;\n  min-height: 48px;\n  padding: 0 16px;\n  cursor: pointer;\n  -webkit-tap-highlight-color: transparent;\n  color: var(--%NS%mat-option-label-text-color, var(--%NS%mat-sys-on-surface));\n  font-family: var(--%NS%mat-option-label-text-font, var(--%NS%mat-sys-label-large-font));\n  line-height: var(--%NS%mat-option-label-text-line-height, var(--%NS%mat-sys-label-large-line-height));\n  font-size: var(--%NS%mat-option-label-text-size, var(--%NS%mat-sys-body-large-size));\n  letter-spacing: var(--%NS%mat-option-label-text-tracking, var(--%NS%mat-sys-label-large-tracking));\n  font-weight: var(--%NS%mat-option-label-text-weight, var(--%NS%mat-sys-body-large-weight));\n}\n.mat-mdc-option:hover:not(.mdc-list-item--disabled) {\n  background-color: var(--%NS%mat-option-hover-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-hover-state-layer-opacity) * 100%), transparent));\n}\n.mat-mdc-option:focus.mdc-list-item, .mat-mdc-option.mat-mdc-option-active.mdc-list-item {\n  background-color: var(--%NS%mat-option-focus-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-focus-state-layer-opacity) * 100%), transparent));\n  outline: 0;\n}\n.mat-mdc-option.mdc-list-item--%NS%selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-active, .mat-mdc-option-multiple, :focus, :hover) {\n  background-color: var(--%NS%mat-option-selected-state-layer-color, var(--%NS%mat-sys-secondary-container));\n}\n.mat-mdc-option.mdc-list-item--%NS%selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-active, .mat-mdc-option-multiple, :focus, :hover) .mdc-list-item__primary-text {\n  color: var(--%NS%mat-option-selected-state-label-text-color, var(--%NS%mat-sys-on-secondary-container));\n}\n.mat-mdc-option .mat-pseudo-checkbox {\n  --%NS%mat-pseudo-checkbox-minimal-selected-checkmark-color: var(--%NS%mat-option-selected-state-label-text-color, var(--%NS%mat-sys-on-secondary-container));\n}\n.mat-mdc-option.mdc-list-item {\n  align-items: center;\n  background: transparent;\n}\n.mat-mdc-option.mdc-list-item--disabled {\n  cursor: default;\n  pointer-events: none;\n}\n.mat-mdc-option.mdc-list-item--disabled .mat-mdc-option-pseudo-checkbox, .mat-mdc-option.mdc-list-item--disabled .mdc-list-item__primary-text, .mat-mdc-option.mdc-list-item--disabled > mat-icon {\n  opacity: 0.38;\n}\n.mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {\n  padding-left: 32px;\n}\n[dir=rtl] .mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {\n  padding-left: 16px;\n  padding-right: 32px;\n}\n.mat-mdc-option .mat-icon,\n.mat-mdc-option .mat-pseudo-checkbox-full {\n  margin-right: 16px;\n  flex-shrink: 0;\n}\n[dir=rtl] .mat-mdc-option .mat-icon,\n[dir=rtl] .mat-mdc-option .mat-pseudo-checkbox-full {\n  margin-right: 0;\n  margin-left: 16px;\n}\n.mat-mdc-option .mat-pseudo-checkbox-minimal {\n  margin-left: 16px;\n  flex-shrink: 0;\n}\n[dir=rtl] .mat-mdc-option .mat-pseudo-checkbox-minimal {\n  margin-right: 16px;\n  margin-left: 0;\n}\n.mat-mdc-option .mat-mdc-option-ripple {\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  position: absolute;\n  pointer-events: none;\n}\n.mat-mdc-option .mdc-list-item__primary-text {\n  white-space: normal;\n  font-size: inherit;\n  font-weight: inherit;\n  letter-spacing: inherit;\n  line-height: inherit;\n  font-family: inherit;\n  text-decoration: inherit;\n  text-transform: inherit;\n  margin-right: auto;\n}\n[dir=rtl] .mat-mdc-option .mdc-list-item__primary-text {\n  margin-right: 0;\n  margin-left: auto;\n}\n@media (forced-colors: active) {\n  .mat-mdc-option.mdc-list-item--%NS%selected:not(:has(.mat-mdc-option-pseudo-checkbox))::after {\n    content: \"\";\n    position: absolute;\n    top: 50%;\n    right: 16px;\n    transform: translateY(-50%);\n    width: 10px;\n    height: 0;\n    border-bottom: solid 10px;\n    border-radius: 10px;\n  }\n  [dir=rtl] .mat-mdc-option.mdc-list-item--%NS%selected:not(:has(.mat-mdc-option-pseudo-checkbox))::after {\n    right: auto;\n    left: 16px;\n  }\n}\n\n.mat-mdc-option-multiple {\n  --%NS%mat-list-list-item-selected-container-color: var(--%NS%mat-list-list-item-container-color, transparent);\n}\n\n.mat-mdc-option-active .mat-focus-indicator::before {\n  content: \"\";\n}\n"],
			encapsulation: 2
		});
	})();
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatOption, [{
		type: Component,
		args: [{
			selector: "mat-option",
			exportAs: "matOption",
			host: {
				"role": "option",
				"[class.mdc-list-item--selected]": "selected",
				"[class.mat-mdc-option-multiple]": "multiple",
				"[class.mat-mdc-option-active]": "active",
				"[class.mdc-list-item--disabled]": "disabled",
				"[id]": "id",
				"[attr.aria-selected]": "selected",
				"[attr.aria-disabled]": "disabled.toString()",
				"(click)": "_selectViaInteraction()",
				"(keydown)": "_handleKeydown($event)",
				"class": "mat-mdc-option mdc-list-item"
			},
			encapsulation: ViewEncapsulation.None,
			imports: [MatPseudoCheckbox, MatRipple],
			template: "<!-- Set aria-hidden=\"true\" to this DOM node and other decorative nodes in this file. This might\n be contributing to issue where sometimes VoiceOver focuses on a TextNode in the a11y tree instead\n of the Option node (#23202). Most assistive technology will generally ignore non-role,\n non-text-content elements. Adding aria-hidden seems to make VoiceOver behave more consistently. -->\n@if (multiple) {\n    <mat-pseudo-checkbox\n        class=\"mat-mdc-option-pseudo-checkbox\"\n        [disabled]=\"disabled\"\n        [state]=\"selected ? 'checked' : 'unchecked'\"\n        aria-hidden=\"true\"></mat-pseudo-checkbox>\n}\n\n<ng-content select=\"mat-icon\"></ng-content>\n\n<span class=\"mdc-list-item__primary-text\" #text><ng-content></ng-content></span>\n\n<!-- Render checkmark at the end for single-selection. -->\n@if (!multiple && selected && !hideSingleSelectionIndicator) {\n    <mat-pseudo-checkbox\n        class=\"mat-mdc-option-pseudo-checkbox\"\n        [disabled]=\"disabled\"\n        state=\"checked\"\n        aria-hidden=\"true\"\n        appearance=\"minimal\"></mat-pseudo-checkbox>\n}\n\n<!-- See a11y notes inside optgroup.ts for context behind this element. -->\n@if (group && group._inert) {\n    <span class=\"cdk-visually-hidden\">({{ group.label }})</span>\n}\n\n<div class=\"mat-mdc-option-ripple mat-focus-indicator\" aria-hidden=\"true\" mat-ripple\n     [matRippleTrigger]=\"_getHostElement()\" [matRippleDisabled]=\"disabled || disableRipple\">\n</div>\n",
			styles: [".mat-mdc-option {\n  -webkit-user-select: none;\n  user-select: none;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  display: flex;\n  position: relative;\n  align-items: center;\n  justify-content: flex-start;\n  overflow: hidden;\n  min-height: 48px;\n  padding: 0 16px;\n  cursor: pointer;\n  -webkit-tap-highlight-color: transparent;\n  color: var(--mat-option-label-text-color, var(--mat-sys-on-surface));\n  font-family: var(--mat-option-label-text-font, var(--mat-sys-label-large-font));\n  line-height: var(--mat-option-label-text-line-height, var(--mat-sys-label-large-line-height));\n  font-size: var(--mat-option-label-text-size, var(--mat-sys-body-large-size));\n  letter-spacing: var(--mat-option-label-text-tracking, var(--mat-sys-label-large-tracking));\n  font-weight: var(--mat-option-label-text-weight, var(--mat-sys-body-large-weight));\n}\n.mat-mdc-option:hover:not(.mdc-list-item--disabled) {\n  background-color: var(--mat-option-hover-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-hover-state-layer-opacity) * 100%), transparent));\n}\n.mat-mdc-option:focus.mdc-list-item, .mat-mdc-option.mat-mdc-option-active.mdc-list-item {\n  background-color: var(--mat-option-focus-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-focus-state-layer-opacity) * 100%), transparent));\n  outline: 0;\n}\n.mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-active, .mat-mdc-option-multiple, :focus, :hover) {\n  background-color: var(--mat-option-selected-state-layer-color, var(--mat-sys-secondary-container));\n}\n.mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-active, .mat-mdc-option-multiple, :focus, :hover) .mdc-list-item__primary-text {\n  color: var(--mat-option-selected-state-label-text-color, var(--mat-sys-on-secondary-container));\n}\n.mat-mdc-option .mat-pseudo-checkbox {\n  --mat-pseudo-checkbox-minimal-selected-checkmark-color: var(--mat-option-selected-state-label-text-color, var(--mat-sys-on-secondary-container));\n}\n.mat-mdc-option.mdc-list-item {\n  align-items: center;\n  background: transparent;\n}\n.mat-mdc-option.mdc-list-item--disabled {\n  cursor: default;\n  pointer-events: none;\n}\n.mat-mdc-option.mdc-list-item--disabled .mat-mdc-option-pseudo-checkbox, .mat-mdc-option.mdc-list-item--disabled .mdc-list-item__primary-text, .mat-mdc-option.mdc-list-item--disabled > mat-icon {\n  opacity: 0.38;\n}\n.mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {\n  padding-left: 32px;\n}\n[dir=rtl] .mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {\n  padding-left: 16px;\n  padding-right: 32px;\n}\n.mat-mdc-option .mat-icon,\n.mat-mdc-option .mat-pseudo-checkbox-full {\n  margin-right: 16px;\n  flex-shrink: 0;\n}\n[dir=rtl] .mat-mdc-option .mat-icon,\n[dir=rtl] .mat-mdc-option .mat-pseudo-checkbox-full {\n  margin-right: 0;\n  margin-left: 16px;\n}\n.mat-mdc-option .mat-pseudo-checkbox-minimal {\n  margin-left: 16px;\n  flex-shrink: 0;\n}\n[dir=rtl] .mat-mdc-option .mat-pseudo-checkbox-minimal {\n  margin-right: 16px;\n  margin-left: 0;\n}\n.mat-mdc-option .mat-mdc-option-ripple {\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  position: absolute;\n  pointer-events: none;\n}\n.mat-mdc-option .mdc-list-item__primary-text {\n  white-space: normal;\n  font-size: inherit;\n  font-weight: inherit;\n  letter-spacing: inherit;\n  line-height: inherit;\n  font-family: inherit;\n  text-decoration: inherit;\n  text-transform: inherit;\n  margin-right: auto;\n}\n[dir=rtl] .mat-mdc-option .mdc-list-item__primary-text {\n  margin-right: 0;\n  margin-left: auto;\n}\n@media (forced-colors: active) {\n  .mat-mdc-option.mdc-list-item--selected:not(:has(.mat-mdc-option-pseudo-checkbox))::after {\n    content: \"\";\n    position: absolute;\n    top: 50%;\n    right: 16px;\n    transform: translateY(-50%);\n    width: 10px;\n    height: 0;\n    border-bottom: solid 10px;\n    border-radius: 10px;\n  }\n  [dir=rtl] .mat-mdc-option.mdc-list-item--selected:not(:has(.mat-mdc-option-pseudo-checkbox))::after {\n    right: auto;\n    left: 16px;\n  }\n}\n\n.mat-mdc-option-multiple {\n  --mat-list-list-item-selected-container-color: var(--mat-list-list-item-container-color, transparent);\n}\n\n.mat-mdc-option-active .mat-focus-indicator::before {\n  content: \"\";\n}\n"]
		}]
	}], () => [], {
		value: [{ type: Input }],
		id: [{ type: Input }],
		disabled: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}],
		onSelectionChange: [{ type: Output }],
		_text: [{
			type: ViewChild,
			args: ["text", { static: true }]
		}]
	});
})();
function _countGroupLabelsBeforeOption(optionIndex, options, optionGroups) {
	if (optionGroups.length) {
		let optionsArray = options.toArray();
		let groups = optionGroups.toArray();
		let groupCounter = 0;
		for (let i = 0; i < optionIndex + 1; i++) if (optionsArray[i].group && optionsArray[i].group === groups[groupCounter]) groupCounter++;
		return groupCounter;
	}
	return 0;
}
function _getOptionScrollPosition(optionOffset, optionHeight, currentScrollPosition, panelHeight) {
	if (optionOffset < currentScrollPosition) return optionOffset;
	if (optionOffset + optionHeight > currentScrollPosition + panelHeight) return Math.max(0, optionOffset - panelHeight + optionHeight);
	return currentScrollPosition;
}
//#endregion
//#region node_modules/@angular/material/fesm2022/_option-module-chunk.mjs
var MatOptionModule = class MatOptionModule {
	static ɵfac = function MatOptionModule_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatOptionModule)();
	};
	static ɵmod = /*@__PURE__*/ ɵɵdefineNgModule({
		type: MatOptionModule,
		imports: [
			MatRippleModule,
			MatPseudoCheckboxModule,
			MatOption,
			MatOptgroup
		],
		exports: [
			MatOption,
			MatOptgroup,
			BidiModule
		]
	});
	static ɵinj = /*@__PURE__*/ ɵɵdefineInjector({ imports: [
		MatRippleModule,
		MatPseudoCheckboxModule,
		MatOption,
		BidiModule
	] });
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatOptionModule, [{
		type: NgModule,
		args: [{
			imports: [
				MatRippleModule,
				MatPseudoCheckboxModule,
				MatOption,
				MatOptgroup
			],
			exports: [
				MatOption,
				MatOptgroup,
				BidiModule
			]
		}]
	}], null, null);
})();
//#endregion
export { MatOption as a, _getOptionScrollPosition as c, MatOptgroup as i, MAT_OPTGROUP as n, MatOptionSelectionChange as o, MAT_OPTION_PARENT_COMPONENT as r, _countGroupLabelsBeforeOption as s, MatOptionModule as t };
