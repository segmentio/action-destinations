export function defaultValues(fields) {
    const obj = {};
    for (const field of Object.keys(fields)) {
        const defaultValue = fields[field].default;
        if (typeof defaultValue !== 'undefined') {
            obj[field] = defaultValue;
        }
    }
    return obj;
}
//# sourceMappingURL=defaults.js.map