"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformBatch = exports.transform = void 0;
const get_1 = require("../get");
const is_directive_1 = require("./is-directive");
const placeholders_1 = require("./placeholders");
const real_type_of_1 = require("../real-type-of");
const remove_undefined_1 = require("../remove-undefined");
const validate_1 = __importDefault(require("./validate"));
const arrify_1 = require("../arrify");
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
            throw new Error(`${name}: expected string, got ${real_type_of_1.realTypeOf(str)}`);
        }
        return fn(str, payload);
    });
}
function runDirective(obj, payload) {
    const name = Object.keys(obj).find((key) => key.startsWith('@'));
    const directiveFn = directives[name];
    const value = obj[name];
    if (typeof directiveFn !== 'function') {
        throw new Error(`${name} is not a valid directive, got ${real_type_of_1.realTypeOf(directiveFn)}`);
    }
    return directiveFn(value, payload);
}
registerDirective('@if', (opts, payload) => {
    let condition = false;
    if (!real_type_of_1.isObject(opts)) {
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
        throw new Error(`@arrayPath expected array, got ${real_type_of_1.realTypeOf(data)}`);
    }
    const [path, itemShape] = data;
    const root = typeof path === 'string' ? get_1.get(payload, path.replace('$.', '')) : resolve(path, payload);
    if (['object', 'array'].includes(real_type_of_1.realTypeOf(root)) &&
        real_type_of_1.realTypeOf(itemShape) === 'object' &&
        Object.keys(itemShape).length > 0) {
        return arrify_1.arrify(root).map((item) => resolve(itemShape, item));
    }
    return root;
});
registerStringDirective('@path', (path, payload) => {
    return get_1.get(payload, path.replace('$.', ''));
});
registerStringDirective('@template', (template, payload) => {
    return placeholders_1.render(template, payload);
});
registerDirective('@literal', (value, payload) => {
    return resolve(value, payload);
});
function resolve(mapping, payload) {
    if (!real_type_of_1.isObject(mapping) && !real_type_of_1.isArray(mapping)) {
        return mapping;
    }
    if (is_directive_1.isDirective(mapping)) {
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
function transform(mapping, data = {}) {
    const realType = real_type_of_1.realTypeOf(data);
    if (realType !== 'object') {
        throw new Error(`data must be an object, got ${realType}`);
    }
    validate_1.default(mapping);
    const resolved = resolve(mapping, data);
    const cleaned = remove_undefined_1.removeUndefined(resolved);
    return cleaned;
}
exports.transform = transform;
function transformBatch(mapping, data = []) {
    const realType = real_type_of_1.realTypeOf(data);
    if (!real_type_of_1.isArray(data)) {
        throw new Error(`data must be an array, got ${realType}`);
    }
    validate_1.default(mapping);
    const resolved = data.map((d) => resolve(mapping, d));
    return remove_undefined_1.removeUndefined(resolved);
}
exports.transformBatch = transformBatch;
//# sourceMappingURL=index.js.map