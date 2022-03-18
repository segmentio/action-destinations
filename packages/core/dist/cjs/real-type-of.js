"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isString = exports.isArray = exports.isObject = exports.realTypeOf = void 0;
function realTypeOf(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}
exports.realTypeOf = realTypeOf;
function isObject(value) {
    return realTypeOf(value) === 'object';
}
exports.isObject = isObject;
function isArray(value) {
    return Array.isArray(value);
}
exports.isArray = isArray;
function isString(value) {
    return typeof value === 'string';
}
exports.isString = isString;
//# sourceMappingURL=real-type-of.js.map