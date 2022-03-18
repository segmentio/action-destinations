"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEmptyValues = void 0;
const real_type_of_1 = require("./real-type-of");
const arrify_1 = require("./arrify");
function removeEmptyValues(obj, schema = {}, isRoot = false) {
    if (!schema.type && !schema.enum) {
        return obj;
    }
    if (real_type_of_1.isArray(obj)) {
        if (!schema.items)
            return obj;
        return obj.filter((item) => removeEmptyValues(item, schema.items) !== undefined);
    }
    if (real_type_of_1.isObject(obj)) {
        if (!schema.properties)
            return obj;
        const newObj = { ...obj };
        for (const key of Object.keys(newObj)) {
            newObj[key] = removeEmptyValues(newObj[key], schema.properties[key]);
            if (newObj[key] === undefined) {
                delete newObj[key];
            }
            if (newObj[key] === '' && isRoot) {
                delete newObj[key];
            }
        }
        return newObj;
    }
    const schemaType = arrify_1.arrify(schema.type);
    if (obj === null && !schemaType.includes('null')) {
        return undefined;
    }
    if (obj === '' && !schemaType.includes('string')) {
        return undefined;
    }
    return obj;
}
exports.removeEmptyValues = removeEmptyValues;
//# sourceMappingURL=remove-empty-values.js.map