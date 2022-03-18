import { isObject } from '../real-type-of';
export function isDirective(obj) {
    if (!isObject(obj)) {
        return false;
    }
    const keys = Object.keys(obj);
    const hasDirectivePrefix = keys.some((key) => key.startsWith('@'));
    if (!hasDirectivePrefix) {
        return false;
    }
    const otherKeys = keys.filter((key) => !key.startsWith('@') && key !== '_metadata');
    if (otherKeys.length === 0) {
        return true;
    }
    return false;
}
//# sourceMappingURL=is-directive.js.map