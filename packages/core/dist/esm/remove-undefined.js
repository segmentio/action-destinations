import { isObject } from './real-type-of';
export function removeUndefined(value) {
    if (Array.isArray(value)) {
        return value.map((item) => removeUndefined(item));
    }
    else if (isObject(value)) {
        const cleaned = Object.assign({}, value);
        Object.keys(cleaned).forEach((key) => {
            if (cleaned[key] === undefined) {
                delete cleaned[key];
            }
            else {
                cleaned[key] = removeUndefined(cleaned[key]);
            }
        });
        return cleaned;
    }
    return value;
}
//# sourceMappingURL=remove-undefined.js.map