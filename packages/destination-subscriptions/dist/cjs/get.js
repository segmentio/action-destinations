"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
function get(object, path, defValue) {
    if (!path)
        return defValue;
    const pathArray = Array.isArray(path)
        ? path
        : path.match(/([^[.\]])+/g);
    const value = pathArray.reduce((previousObject, key) => previousObject && previousObject[key], object);
    return typeof value === 'undefined' ? defValue : value;
}
exports.get = get;
//# sourceMappingURL=get.js.map