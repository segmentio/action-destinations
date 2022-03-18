import { isArray, isObject } from './real-type-of';
import { arrify } from './arrify';
export function removeEmptyValues(obj, schema = {}, isRoot = false) {
    if (!schema.type && !schema.enum) {
        return obj;
    }
    if (isArray(obj)) {
        if (!schema.items)
            return obj;
        return obj.filter((item) => removeEmptyValues(item, schema.items) !== undefined);
    }
    if (isObject(obj)) {
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
    const schemaType = arrify(schema.type);
    if (obj === null && !schemaType.includes('null')) {
        return undefined;
    }
    if (obj === '' && !schemaType.includes('string')) {
        return undefined;
    }
    return obj;
}
//# sourceMappingURL=remove-empty-values.js.map