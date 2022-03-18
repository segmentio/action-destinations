"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultValues = void 0;
function defaultValues(fields) {
    const obj = {};
    for (const field of Object.keys(fields)) {
        const defaultValue = fields[field].default;
        if (typeof defaultValue !== 'undefined') {
            obj[field] = defaultValue;
        }
    }
    return obj;
}
exports.defaultValues = defaultValues;
//# sourceMappingURL=defaults.js.map