export function get(obj, path) {
    if (path === '' || path === '.')
        return obj;
    if (path === null || path == undefined)
        return undefined;
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
    return pathArray.reduce((prevObj, key) => prevObj && prevObj[key], obj);
}
//# sourceMappingURL=get.js.map