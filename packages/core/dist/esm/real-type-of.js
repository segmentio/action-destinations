export function realTypeOf(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}
export function isObject(value) {
    return realTypeOf(value) === 'object';
}
export function isArray(value) {
    return Array.isArray(value);
}
export function isString(value) {
    return typeof value === 'string';
}
//# sourceMappingURL=real-type-of.js.map