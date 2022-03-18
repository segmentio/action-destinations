"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrifyFields = exports.arrify = void 0;
const real_type_of_1 = require("./real-type-of");
function arrify(value, treatNullAsEmpty = true) {
    if (value === undefined || value === null)
        return treatNullAsEmpty ? [] : value;
    if (real_type_of_1.isArray(value))
        return value;
    return [value];
}
exports.arrify = arrify;
function arrifyFields(obj, schema = {}) {
    if (!real_type_of_1.isObject(obj)) {
        return obj;
    }
    if (!schema.properties)
        return obj;
    for (const key of Object.keys(obj)) {
        const fieldSchema = schema.properties[key];
        if (!fieldSchema)
            continue;
        if (fieldSchema.type === 'array') {
            obj[key] = arrify(obj[key], false);
        }
    }
    return obj;
}
exports.arrifyFields = arrifyFields;
//# sourceMappingURL=arrify.js.map