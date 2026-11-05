import { Kn as ConnectableObservable } from "./zipWith-llrjS8GZ.js";
//#region node_modules/@angular/cdk/fesm2022/_data-source-chunk.mjs
var DataSource = class {};
function isDataSource(value) {
	return value && typeof value.connect === "function" && !(value instanceof ConnectableObservable);
}
//#endregion
export { isDataSource as n, DataSource as t };
