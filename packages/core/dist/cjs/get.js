"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
function get(obj, path) {
    if (path === '' || path === '.')
        return obj;
    if (path === null || path == undefined)
        return undefined;
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
    return pathArray.reduce((prevObj, key) => prevObj && prevObj[key], obj);
}
exports.get = get;
//# sourceMappingURL=get.js.map