export function mapValues(obj, key) {
    return Object.entries(obj).reduce((agg, [name, value]) => {
        agg[name] = value[key];
        return agg;
    }, {});
}
//# sourceMappingURL=map-values.js.map