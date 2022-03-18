"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDirective = void 0;
const real_type_of_1 = require("../real-type-of");
function isDirective(obj) {
    if (!real_type_of_1.isObject(obj)) {
        return false;
    }
    const keys = Object.keys(obj);
    const hasDirectivePrefix = keys.some((key) => key.startsWith('@'));
    if (!hasDirectivePrefix) {
        return false;
    }
    const otherKeys = keys.filter((key) => !key.startsWith('@') && key !== '_metadata');
    if (otherKeys.length === 0) {
        return true;
    }
    return false;
}
exports.isDirective = isDirective;
//# sourceMappingURL=is-directive.js.map