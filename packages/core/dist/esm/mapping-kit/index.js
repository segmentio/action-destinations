import { get } from '../get';
import { isDirective } from './is-directive';
import { render } from './placeholders';
import { realTypeOf, isObject, isArray } from '../real-type-of';
import { removeUndefined } from '../remove-undefined';
import validate from './validate';
import { arrify } from '../arrify';
const directives = {};
const directiveRegExp = /^@[a-z][a-zA-Z0-9]+$/;
function registerDirective(name, fn) {
    if (!directiveRegExp.exec(name)) {
        throw new Error(`"${name}" is an invalid directive name`);
    }
    directives[name] = fn;
}
function registerStringDirective(name, fn) {
    registerDirective(name, (value, payload) => {
        const str = resolve(value, payload);
        if (typeof str !== 'string') {
            throw new Error(`${name}: expected string, got ${realTypeOf(str)}`);
        }
        return fn(str, payload);
    });
}
function runDirective(obj, payload) {
    const name = Object.keys(obj).find((key) => key.startsWith('@'));
    const directiveFn = directives[name];
    const value = obj[name];
    if (typeof directiveFn !== 'function') {
        throw new Error(`${name} is not a valid directive, got ${realTypeOf(directiveFn)}`);
    }
    return directiveFn(value, payload);
}
registerDirective('@if', (opts, payload) => {
    let condition = false;
    if (!isObject(opts)) {
        throw new Error('@if requires an object with an "exists" key');
    }
    if (opts.exists !== undefined) {
        const value = resolve(opts.exists, payload);
        condition = value !== undefined && value !== null;
    }
    else {
        throw new Error('@if requires an "exists" key');
    }
    if (condition && opts.then !== undefined) {
        return resolve(opts.then, payload);
    }
    else if (!condition && opts.else) {
        return resolve(opts.else, payload);
    }
});
registerDirective('@arrayPath', (data, payload) => {
    if (!Array.isArray(data)) {
        throw new Error(`@arrayPath expected array, got ${realTypeOf(data)}`);
    }
    const [path, itemShape] = data;
    const root = typeof path === 'string' ? get(payload, path.replace('$.', '')) : resolve(path, payload);
    if (['object', 'array'].includes(realTypeOf(root)) &&
        realTypeOf(itemShape) === 'object' &&
        Object.keys(itemShape).length > 0) {
        return arrify(root).map((item) => resolve(itemShape, item));
    }
    return root;
});
registerStringDirective('@path', (path, payload) => {
    return get(payload, path.replace('$.', ''));
});
registerStringDirective('@template', (template, payload) => {
    return render(template, payload);
});
registerDirective('@literal', (value, payload) => {
    return resolve(value, payload);
});
function resolve(mapping, payload) {
    if (!isObject(mapping) && !isArray(mapping)) {
        return mapping;
    }
    if (isDirective(mapping)) {
        return runDirective(mapping, payload);
    }
    if (Array.isArray(mapping)) {
        return mapping.map((value) => resolve(value, payload));
    }
    const resolved = {};
    for (const key of Object.keys(mapping)) {
        resolved[key] = resolve(mapping[key], payload);
    }
    return resolved;
}
export function transform(mapping, data = {}) {
    const realType = realTypeOf(data);
    if (realType !== 'object') {
        throw new Error(`data must be an object, got ${realType}`);
    }
    validate(mapping);
    const resolved = resolve(mapping, data);
    const cleaned = removeUndefined(resolved);
    return cleaned;
}
export function transformBatch(mapping, data = []) {
    const realType = realTypeOf(data);
    if (!isArray(data)) {
        throw new Error(`data must be an array, got ${realType}`);
    }
    validate(mapping);
    const resolved = data.map((d) => resolve(mapping, d));
    return removeUndefined(resolved);
}
//# sourceMappingURL=index.js.map