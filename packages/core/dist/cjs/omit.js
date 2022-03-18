"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omit = void 0;
function omit(obj, keys) {
    return Object.keys(obj || {}).reduce((newObject, key) => {
        if (keys.indexOf(key) === -1)
            newObject[key] = obj[key];
        return newObject;
    }, {});
}
exports.omit = omit;
//# sourceMappingURL=omit.js.map