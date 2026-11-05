import { Cr as inject, la as ɵɵdefineInjector } from "./_resource-chunk-Bx4DDTyu.js";
import { Ai as setClassMetadata, Ga as ɵɵdefineNgModule, Gt as ChangeDetectionStrategy, Ji as ɵɵInheritDefinitionFeature, Jt as Component, Nn as NgModule, O as booleanAttribute, Ro as ɵɵlistener, S as ViewChild, Sn as Input, Ua as ɵɵdefineComponent, Wa as ɵɵdefineDirective, Xi as ɵɵProvidersFeature, Xs as ɵɵviewQuery, _o as ɵɵgetInheritedFactory, aa as ɵɵattribute, ao as ɵɵelementContainer, f as HostAttributeToken, fr as ViewContainerRef, no as ɵɵdomProperty, pr as ViewEncapsulation, rt as numberAttribute, ss as ɵɵqueryRefresh, un as Directive, zo as ɵɵloadQuery } from "./core-CvQoWPX1.js";
import { Et as take, Un as BehaviorSubject, fn as map } from "./zipWith-llrjS8GZ.js";
import { s as merge } from "./esm5-ZXh7Ahry.js";
import { BidiModule } from "./@angular_cdk_bidi.js";
import { t as DataSource } from "./_data-source-chunk-DfTF3aCv.js";
import { CDK_TREE_NODE_OUTLET_NODE, CdkNestedTreeNode, CdkTree, CdkTreeModule, CdkTreeNode, CdkTreeNodeDef, CdkTreeNodeOutlet, CdkTreeNodePadding, CdkTreeNodeToggle } from "./@angular_cdk_tree.js";
//#region node_modules/@angular/material/fesm2022/tree.mjs
function isNoopTreeKeyManager(keyManager) {
	return !!keyManager._isNoopTreeKeyManager;
}
var MatTreeNode = class MatTreeNode extends CdkTreeNode {
	get tabIndexInputBinding() {
		return this._tabIndexInputBinding;
	}
	set tabIndexInputBinding(value) {
		this._tabIndexInputBinding = value;
	}
	_tabIndexInputBinding;
	defaultTabIndex = 0;
	_getTabindexAttribute() {
		if (isNoopTreeKeyManager(this._tree._keyManager)) return this.tabIndexInputBinding;
		return this._tabindex;
	}
	get disabled() {
		return this.isDisabled;
	}
	set disabled(value) {
		this.isDisabled = value;
	}
	constructor() {
		super();
		const tabIndex = inject(new HostAttributeToken("tabindex"), { optional: true });
		this.tabIndexInputBinding = Number(tabIndex) || this.defaultTabIndex;
	}
	ngOnInit() {
		super.ngOnInit();
	}
	ngOnDestroy() {
		super.ngOnDestroy();
	}
	static ɵfac = function MatTreeNode_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatTreeNode)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatTreeNode,
		selectors: [["mat-tree-node"]],
		hostAttrs: [1, "mat-tree-node"],
		hostVars: 5,
		hostBindings: function MatTreeNode_HostBindings(rf, ctx) {
			if (rf & 1) ɵɵlistener("click", function MatTreeNode_click_HostBindingHandler() {
				return ctx._focusItem();
			});
			if (rf & 2) {
				ɵɵdomProperty("tabIndex", ctx._getTabindexAttribute());
				ɵɵattribute("aria-expanded", ctx._getAriaExpanded())("aria-level", ctx.level + 1)("aria-posinset", ctx._getPositionInSet())("aria-setsize", ctx._getSetSize());
			}
		},
		inputs: {
			tabIndexInputBinding: [
				2,
				"tabIndex",
				"tabIndexInputBinding",
				(value) => value == null ? 0 : numberAttribute(value)
			],
			disabled: [
				2,
				"disabled",
				"disabled",
				booleanAttribute
			]
		},
		outputs: {
			activation: "activation",
			expandedChange: "expandedChange"
		},
		exportAs: ["matTreeNode"],
		features: [ɵɵProvidersFeature([{
			provide: CdkTreeNode,
			useExisting: MatTreeNode
		}]), ɵɵInheritDefinitionFeature]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTreeNode, [{
		type: Directive,
		args: [{
			selector: "mat-tree-node",
			exportAs: "matTreeNode",
			outputs: ["activation", "expandedChange"],
			providers: [{
				provide: CdkTreeNode,
				useExisting: MatTreeNode
			}],
			host: {
				"class": "mat-tree-node",
				"[attr.aria-expanded]": "_getAriaExpanded()",
				"[attr.aria-level]": "level + 1",
				"[attr.aria-posinset]": "_getPositionInSet()",
				"[attr.aria-setsize]": "_getSetSize()",
				"(click)": "_focusItem()",
				"[tabindex]": "_getTabindexAttribute()"
			}
		}]
	}], () => [], {
		tabIndexInputBinding: [{
			type: Input,
			args: [{
				transform: (value) => value == null ? 0 : numberAttribute(value),
				alias: "tabIndex"
			}]
		}],
		disabled: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}]
	});
})();
var MatTreeNodeDef = class MatTreeNodeDef extends CdkTreeNodeDef {
	data;
	static ɵfac = /*@__PURE__*/ (() => {
		let ɵMatTreeNodeDef_BaseFactory = void 0;
		return function MatTreeNodeDef_Factory(__ngFactoryType__) {
			return (ɵMatTreeNodeDef_BaseFactory || (ɵMatTreeNodeDef_BaseFactory = ɵɵgetInheritedFactory(MatTreeNodeDef)))(__ngFactoryType__ || MatTreeNodeDef);
		};
	})();
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatTreeNodeDef,
		selectors: [[
			"",
			"matTreeNodeDef",
			""
		]],
		inputs: {
			when: [
				0,
				"matTreeNodeDefWhen",
				"when"
			],
			data: [
				0,
				"matTreeNode",
				"data"
			]
		},
		features: [ɵɵProvidersFeature([{
			provide: CdkTreeNodeDef,
			useExisting: MatTreeNodeDef
		}]), ɵɵInheritDefinitionFeature]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTreeNodeDef, [{
		type: Directive,
		args: [{
			selector: "[matTreeNodeDef]",
			inputs: [{
				name: "when",
				alias: "matTreeNodeDefWhen"
			}],
			providers: [{
				provide: CdkTreeNodeDef,
				useExisting: MatTreeNodeDef
			}]
		}]
	}], null, { data: [{
		type: Input,
		args: ["matTreeNode"]
	}] });
})();
var MatNestedTreeNode = class MatNestedTreeNode extends CdkNestedTreeNode {
	node;
	get disabled() {
		return this.isDisabled;
	}
	set disabled(value) {
		this.isDisabled = value;
	}
	get tabIndex() {
		return this.isDisabled ? -1 : this._tabIndex;
	}
	set tabIndex(value) {
		this._tabIndex = value;
	}
	_tabIndex;
	ngOnInit() {
		super.ngOnInit();
	}
	ngAfterContentInit() {
		super.ngAfterContentInit();
	}
	ngOnDestroy() {
		super.ngOnDestroy();
	}
	static ɵfac = /*@__PURE__*/ (() => {
		let ɵMatNestedTreeNode_BaseFactory = void 0;
		return function MatNestedTreeNode_Factory(__ngFactoryType__) {
			return (ɵMatNestedTreeNode_BaseFactory || (ɵMatNestedTreeNode_BaseFactory = ɵɵgetInheritedFactory(MatNestedTreeNode)))(__ngFactoryType__ || MatNestedTreeNode);
		};
	})();
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatNestedTreeNode,
		selectors: [["mat-nested-tree-node"]],
		hostAttrs: [1, "mat-nested-tree-node"],
		inputs: {
			node: [
				0,
				"matNestedTreeNode",
				"node"
			],
			disabled: [
				2,
				"disabled",
				"disabled",
				booleanAttribute
			],
			tabIndex: [
				2,
				"tabIndex",
				"tabIndex",
				(value) => value == null ? 0 : numberAttribute(value)
			]
		},
		outputs: {
			activation: "activation",
			expandedChange: "expandedChange"
		},
		exportAs: ["matNestedTreeNode"],
		features: [ɵɵProvidersFeature([
			{
				provide: CdkNestedTreeNode,
				useExisting: MatNestedTreeNode
			},
			{
				provide: CdkTreeNode,
				useExisting: MatNestedTreeNode
			},
			{
				provide: CDK_TREE_NODE_OUTLET_NODE,
				useExisting: MatNestedTreeNode
			}
		]), ɵɵInheritDefinitionFeature]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatNestedTreeNode, [{
		type: Directive,
		args: [{
			selector: "mat-nested-tree-node",
			exportAs: "matNestedTreeNode",
			outputs: ["activation", "expandedChange"],
			providers: [
				{
					provide: CdkNestedTreeNode,
					useExisting: MatNestedTreeNode
				},
				{
					provide: CdkTreeNode,
					useExisting: MatNestedTreeNode
				},
				{
					provide: CDK_TREE_NODE_OUTLET_NODE,
					useExisting: MatNestedTreeNode
				}
			],
			host: { "class": "mat-nested-tree-node" }
		}]
	}], null, {
		node: [{
			type: Input,
			args: ["matNestedTreeNode"]
		}],
		disabled: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}],
		tabIndex: [{
			type: Input,
			args: [{ transform: (value) => value == null ? 0 : numberAttribute(value) }]
		}]
	});
})();
var MatTreeNodePadding = class MatTreeNodePadding extends CdkTreeNodePadding {
	get level() {
		return this._level;
	}
	set level(value) {
		this._setLevelInput(value);
	}
	get indent() {
		return this._indent;
	}
	set indent(indent) {
		this._setIndentInput(indent);
	}
	static ɵfac = /*@__PURE__*/ (() => {
		let ɵMatTreeNodePadding_BaseFactory = void 0;
		return function MatTreeNodePadding_Factory(__ngFactoryType__) {
			return (ɵMatTreeNodePadding_BaseFactory || (ɵMatTreeNodePadding_BaseFactory = ɵɵgetInheritedFactory(MatTreeNodePadding)))(__ngFactoryType__ || MatTreeNodePadding);
		};
	})();
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatTreeNodePadding,
		selectors: [[
			"",
			"matTreeNodePadding",
			""
		]],
		inputs: {
			level: [
				2,
				"matTreeNodePadding",
				"level",
				numberAttribute
			],
			indent: [
				0,
				"matTreeNodePaddingIndent",
				"indent"
			]
		},
		features: [ɵɵProvidersFeature([{
			provide: CdkTreeNodePadding,
			useExisting: MatTreeNodePadding
		}]), ɵɵInheritDefinitionFeature]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTreeNodePadding, [{
		type: Directive,
		args: [{
			selector: "[matTreeNodePadding]",
			providers: [{
				provide: CdkTreeNodePadding,
				useExisting: MatTreeNodePadding
			}]
		}]
	}], null, {
		level: [{
			type: Input,
			args: [{
				alias: "matTreeNodePadding",
				transform: numberAttribute
			}]
		}],
		indent: [{
			type: Input,
			args: ["matTreeNodePaddingIndent"]
		}]
	});
})();
var MatTreeNodeOutlet = class MatTreeNodeOutlet {
	viewContainer = inject(ViewContainerRef);
	_node = inject(CDK_TREE_NODE_OUTLET_NODE, { optional: true });
	static ɵfac = function MatTreeNodeOutlet_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatTreeNodeOutlet)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatTreeNodeOutlet,
		selectors: [[
			"",
			"matTreeNodeOutlet",
			""
		]],
		features: [ɵɵProvidersFeature([{
			provide: CdkTreeNodeOutlet,
			useExisting: MatTreeNodeOutlet
		}])]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTreeNodeOutlet, [{
		type: Directive,
		args: [{
			selector: "[matTreeNodeOutlet]",
			providers: [{
				provide: CdkTreeNodeOutlet,
				useExisting: MatTreeNodeOutlet
			}]
		}]
	}], null, null);
})();
var MatTree = class MatTree extends CdkTree {
	_nodeOutlet = void 0;
	static ɵfac = /*@__PURE__*/ (() => {
		let ɵMatTree_BaseFactory = void 0;
		return function MatTree_Factory(__ngFactoryType__) {
			return (ɵMatTree_BaseFactory || (ɵMatTree_BaseFactory = ɵɵgetInheritedFactory(MatTree)))(__ngFactoryType__ || MatTree);
		};
	})();
	static ɵcmp = /*@__PURE__*/ ɵɵdefineComponent({
		type: MatTree,
		selectors: [["mat-tree"]],
		viewQuery: function MatTree_Query(rf, ctx) {
			if (rf & 1) ɵɵviewQuery(MatTreeNodeOutlet, 7);
			if (rf & 2) {
				let _t = void 0;
				ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._nodeOutlet = _t.first);
			}
		},
		hostAttrs: [1, "mat-tree"],
		exportAs: ["matTree"],
		features: [ɵɵProvidersFeature([{
			provide: CdkTree,
			useExisting: MatTree
		}]), ɵɵInheritDefinitionFeature],
		decls: 1,
		vars: 0,
		consts: [["matTreeNodeOutlet", ""]],
		template: function MatTree_Template(rf, ctx) {
			if (rf & 1) ɵɵelementContainer(0, 0);
		},
		dependencies: [MatTreeNodeOutlet],
		styles: [".mat-tree {\n  display: block;\n  background-color: var(--%NS%mat-tree-container-background-color, var(--%NS%mat-sys-surface));\n}\n\n.mat-tree-node,\n.mat-nested-tree-node {\n  color: var(--%NS%mat-tree-node-text-color, var(--%NS%mat-sys-on-surface));\n  font-family: var(--%NS%mat-tree-node-text-font, var(--%NS%mat-sys-body-large-font));\n  font-size: var(--%NS%mat-tree-node-text-size, var(--%NS%mat-sys-body-large-size));\n  font-weight: var(--%NS%mat-tree-node-text-weight, var(--%NS%mat-sys-body-large-weight));\n}\n\n.mat-tree-node {\n  display: flex;\n  align-items: center;\n  flex: 1;\n  word-wrap: break-word;\n  min-height: var(--%NS%mat-tree-node-min-height, 48px);\n}\n\n.mat-nested-tree-node {\n  border-bottom-width: 0;\n}\n"],
		encapsulation: 2,
		changeDetection: 1
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTree, [{
		type: Component,
		args: [{
			selector: "mat-tree",
			exportAs: "matTree",
			template: `<ng-container matTreeNodeOutlet></ng-container>`,
			host: { "class": "mat-tree" },
			encapsulation: ViewEncapsulation.None,
			changeDetection: ChangeDetectionStrategy.Eager,
			providers: [{
				provide: CdkTree,
				useExisting: MatTree
			}],
			imports: [MatTreeNodeOutlet],
			styles: [".mat-tree {\n  display: block;\n  background-color: var(--mat-tree-container-background-color, var(--mat-sys-surface));\n}\n\n.mat-tree-node,\n.mat-nested-tree-node {\n  color: var(--mat-tree-node-text-color, var(--mat-sys-on-surface));\n  font-family: var(--mat-tree-node-text-font, var(--mat-sys-body-large-font));\n  font-size: var(--mat-tree-node-text-size, var(--mat-sys-body-large-size));\n  font-weight: var(--mat-tree-node-text-weight, var(--mat-sys-body-large-weight));\n}\n\n.mat-tree-node {\n  display: flex;\n  align-items: center;\n  flex: 1;\n  word-wrap: break-word;\n  min-height: var(--mat-tree-node-min-height, 48px);\n}\n\n.mat-nested-tree-node {\n  border-bottom-width: 0;\n}\n"]
		}]
	}], null, { _nodeOutlet: [{
		type: ViewChild,
		args: [MatTreeNodeOutlet, { static: true }]
	}] });
})();
var MatTreeNodeToggle = class MatTreeNodeToggle extends CdkTreeNodeToggle {
	static ɵfac = /*@__PURE__*/ (() => {
		let ɵMatTreeNodeToggle_BaseFactory = void 0;
		return function MatTreeNodeToggle_Factory(__ngFactoryType__) {
			return (ɵMatTreeNodeToggle_BaseFactory || (ɵMatTreeNodeToggle_BaseFactory = ɵɵgetInheritedFactory(MatTreeNodeToggle)))(__ngFactoryType__ || MatTreeNodeToggle);
		};
	})();
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatTreeNodeToggle,
		selectors: [[
			"",
			"matTreeNodeToggle",
			""
		]],
		inputs: { recursive: [
			0,
			"matTreeNodeToggleRecursive",
			"recursive"
		] },
		features: [ɵɵProvidersFeature([{
			provide: CdkTreeNodeToggle,
			useExisting: MatTreeNodeToggle
		}]), ɵɵInheritDefinitionFeature]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTreeNodeToggle, [{
		type: Directive,
		args: [{
			selector: "[matTreeNodeToggle]",
			providers: [{
				provide: CdkTreeNodeToggle,
				useExisting: MatTreeNodeToggle
			}],
			inputs: [{
				name: "recursive",
				alias: "matTreeNodeToggleRecursive"
			}]
		}]
	}], null, null);
})();
var MAT_TREE_DIRECTIVES = [
	MatNestedTreeNode,
	MatTreeNodeDef,
	MatTreeNodePadding,
	MatTreeNodeToggle,
	MatTree,
	MatTreeNode,
	MatTreeNodeOutlet
];
var MatTreeModule = class MatTreeModule {
	static ɵfac = function MatTreeModule_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatTreeModule)();
	};
	static ɵmod = /*@__PURE__*/ ɵɵdefineNgModule({
		type: MatTreeModule,
		imports: [
			CdkTreeModule,
			MatNestedTreeNode,
			MatTreeNodeDef,
			MatTreeNodePadding,
			MatTreeNodeToggle,
			MatTree,
			MatTreeNode,
			MatTreeNodeOutlet
		],
		exports: [
			BidiModule,
			MatNestedTreeNode,
			MatTreeNodeDef,
			MatTreeNodePadding,
			MatTreeNodeToggle,
			MatTree,
			MatTreeNode,
			MatTreeNodeOutlet
		]
	});
	static ɵinj = /*@__PURE__*/ ɵɵdefineInjector({ imports: [CdkTreeModule, BidiModule] });
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTreeModule, [{
		type: NgModule,
		args: [{
			imports: [CdkTreeModule, ...MAT_TREE_DIRECTIVES],
			exports: [BidiModule, MAT_TREE_DIRECTIVES]
		}]
	}], null, null);
})();
var MatTreeFlattener = class {
	transformFunction;
	getLevel;
	isExpandable;
	getChildren;
	constructor(transformFunction, getLevel, isExpandable, getChildren) {
		this.transformFunction = transformFunction;
		this.getLevel = getLevel;
		this.isExpandable = isExpandable;
		this.getChildren = getChildren;
	}
	_flattenNode(node, level, resultNodes, parentMap) {
		const flatNode = this.transformFunction(node, level);
		resultNodes.push(flatNode);
		if (this.isExpandable(flatNode)) {
			const childrenNodes = this.getChildren(node);
			if (childrenNodes) {
				if (Array.isArray(childrenNodes)) this._flattenChildren(childrenNodes, level, resultNodes, parentMap);
				else childrenNodes.pipe(take(1)).subscribe((children) => {
					this._flattenChildren(children, level, resultNodes, parentMap);
				});
			}
		}
		return resultNodes;
	}
	_flattenChildren(children, level, resultNodes, parentMap) {
		children.forEach((child, index) => {
			let childParentMap = parentMap.slice();
			childParentMap.push(index != children.length - 1);
			this._flattenNode(child, level + 1, resultNodes, childParentMap);
		});
	}
	flattenNodes(structuredData) {
		let resultNodes = [];
		structuredData.forEach((node) => this._flattenNode(node, 0, resultNodes, []));
		return resultNodes;
	}
	expandFlattenedNodes(nodes, treeControl) {
		let results = [];
		let currentExpand = [];
		currentExpand[0] = true;
		nodes.forEach((node) => {
			let expand = true;
			for (let i = 0; i <= this.getLevel(node); i++) expand = expand && currentExpand[i];
			if (expand) results.push(node);
			if (this.isExpandable(node)) currentExpand[this.getLevel(node) + 1] = treeControl.isExpanded(node);
		});
		return results;
	}
};
var MatTreeFlatDataSource = class extends DataSource {
	_treeControl;
	_treeFlattener;
	_flattenedData = new BehaviorSubject([]);
	_expandedData = new BehaviorSubject([]);
	get data() {
		return this._data.value;
	}
	set data(value) {
		this._data.next(value);
		this._flattenedData.next(this._treeFlattener.flattenNodes(this.data));
		this._treeControl.dataNodes = this._flattenedData.value;
	}
	_data = new BehaviorSubject([]);
	constructor(_treeControl, _treeFlattener, initialData) {
		super();
		this._treeControl = _treeControl;
		this._treeFlattener = _treeFlattener;
		if (initialData) this.data = initialData;
	}
	connect(collectionViewer) {
		return merge(collectionViewer.viewChange, this._treeControl.expansionModel.changed, this._flattenedData).pipe(map(() => {
			this._expandedData.next(this._treeFlattener.expandFlattenedNodes(this._flattenedData.value, this._treeControl));
			return this._expandedData.value;
		}));
	}
	disconnect() {}
};
var MatTreeNestedDataSource = class extends DataSource {
	get data() {
		return this._data.value;
	}
	set data(value) {
		this._data.next(value);
	}
	_data = new BehaviorSubject([]);
	connect(collectionViewer) {
		return merge(...[collectionViewer.viewChange, this._data]).pipe(map(() => this.data));
	}
	disconnect() {}
};
//#endregion
export { MatNestedTreeNode, MatTree, MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule, MatTreeNestedDataSource, MatTreeNode, MatTreeNodeDef, MatTreeNodeOutlet, MatTreeNodePadding, MatTreeNodeToggle };
