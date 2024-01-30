function camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function isObject(obj: any): boolean {
    return obj === Object(obj) && !Array.isArray(obj);
}

function convertKeysToSnakeCase(obj: any): any {
    if (!isObject(obj)) return obj;

    const newObj: any = {};
    Object.keys(obj).forEach(key => {
        const val = obj[key];
        const newKey = camelToSnake(key);
        newObj[newKey] = isObject(val) ? convertKeysToSnakeCase(val) : val;
    });
    return newObj;
}