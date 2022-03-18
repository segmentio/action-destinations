export function get(object, path, defValue) {
    if (!path)
        return defValue;
    const pathArray = Array.isArray(path)
        ? path
        : path.match(/([^[.\]])+/g);
    const value = pathArray.reduce((previousObject, key) => previousObject && previousObject[key], object);
    return typeof value === 'undefined' ? defValue : value;
}
//# sourceMappingURL=get.js.map