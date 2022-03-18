import { isArray, isObject } from './real-type-of';
export function arrify(value, treatNullAsEmpty = true) {
    if (value === undefined || value === null)
        return treatNullAsEmpty ? [] : value;
    if (isArray(value))
        return value;
    return [value];
}
export function arrifyFields(obj, schema = {}) {
    if (!isObject(obj)) {
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
//# sourceMappingURL=arrify.js.map