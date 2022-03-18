"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aggregate_error_1 = __importDefault(require("aggregate-error"));
const ts_custom_error_1 = require("ts-custom-error");
const is_directive_1 = require("./is-directive");
const real_type_of_1 = require("../real-type-of");
class ValidationError extends ts_custom_error_1.CustomError {
    constructor(message, stack = []) {
        super(`/${stack.join('/')} ${message}.`);
    }
}
function flatAggregate(errors) {
    const result = [];
    errors.forEach((error) => {
        if (error instanceof aggregate_error_1.default) {
            result.push(...error);
        }
        else {
            result.push(error);
        }
    });
    return result;
}
function realTypeOrDirective(value) {
    const type = real_type_of_1.realTypeOf(value);
    if (type === 'object' && Object.keys(value).some((k) => k.startsWith('@'))) {
        return 'directive';
    }
    return type;
}
const directives = {};
function validateDirective(obj, stack = []) {
    if (!is_directive_1.isDirective(obj) && !real_type_of_1.isObject(obj)) {
        const type = real_type_of_1.realTypeOf(obj);
        throw new ValidationError(`should be a directive object but it is ${indefiniteArticle(type)} ${type}`, stack);
    }
    const keys = Object.keys(obj);
    const directiveKeys = keys.filter((key) => key.startsWith('@'));
    if (directiveKeys.length > 1) {
        throw new ValidationError(`should only have one @-prefixed key but it has ${directiveKeys.length} keys`, stack);
    }
    const otherKeys = keys.filter((key) => !key.startsWith('@') && key !== '_metadata');
    if (otherKeys.length > 0) {
        throw new ValidationError(`should only have one @-prefixed key but it has ${keys.length} keys`, stack);
    }
    const directiveKey = directiveKeys[0];
    const fn = directives[directiveKey];
    if (typeof fn !== 'function') {
        throw new ValidationError(`has an invalid directive: ${directiveKey}`, stack);
    }
    fn(obj[directiveKey], stack);
}
function validateDirectiveOrRaw(v, stack = []) {
    const type = realTypeOrDirective(v);
    switch (type) {
        case 'directive':
            return validateDirective(v, stack);
        case 'object':
        case 'array':
        case 'boolean':
        case 'string':
        case 'number':
        case 'null':
            return;
        default:
            throw new ValidationError(`should be a mapping directive or a JSON value but it is ${indefiniteArticle(type)} ${type}`, stack);
    }
}
function validateDirectiveOrString(v, stack = []) {
    const type = realTypeOrDirective(v);
    switch (type) {
        case 'directive':
            return validateDirective(v, stack);
        case 'string':
            return;
        default:
            throw new ValidationError(`should be a string or a mapping directive but it is ${indefiniteArticle(type)} ${type}`, stack);
    }
}
function validateObject(value, stack = []) {
    const type = realTypeOrDirective(value);
    if (type !== 'object') {
        throw new ValidationError(`should be an object but it is ${indefiniteArticle(type)} ${type}`, stack);
    }
    const obj = value;
    const keys = Object.keys(obj);
    const directiveKey = keys.find((k) => k.charAt(0) === '@');
    if (directiveKey) {
        throw new ValidationError(`shouldn't have directive (@-prefixed) keys but it has ${JSON.stringify(directiveKey)}`, stack);
    }
    const errors = [];
    keys.forEach((k) => {
        try {
            validate(obj[k], [...stack, k]);
        }
        catch (e) {
            errors.push(e);
        }
    });
    if (errors.length) {
        throw new aggregate_error_1.default(flatAggregate(errors));
    }
}
function validateObjectWithFields(input, fields, stack = []) {
    validateObject(input, stack);
    const errors = [];
    const obj = input;
    Object.entries(fields).forEach(([prop, { required, optional }]) => {
        try {
            if (required) {
                if (obj[prop] === undefined) {
                    throw new ValidationError(`should have field ${JSON.stringify(prop)} but it doesn't`, stack);
                }
                required(obj[prop], [...stack, prop]);
            }
            else if (optional) {
                if (obj[prop] !== undefined) {
                    optional(obj[prop], [...stack, prop]);
                }
            }
        }
        catch (error) {
            errors.push(error);
        }
    });
    if (errors.length) {
        throw new aggregate_error_1.default(flatAggregate(errors));
    }
}
function validateArray(arr, stack = []) {
    const type = real_type_of_1.realTypeOf(arr);
    if (type !== 'array') {
        throw new ValidationError(`should be an array but it is ${indefiniteArticle(type)} ${type}`, stack);
    }
}
function directive(names, fn) {
    if (!Array.isArray(names)) {
        names = [names];
    }
    names.forEach((name) => {
        directives[name] = (v, stack = []) => {
            try {
                fn(v, [...stack, name]);
            }
            catch (e) {
                if (e instanceof ValidationError || e instanceof aggregate_error_1.default) {
                    throw e;
                }
                throw new ValidationError(e.message, stack);
            }
        };
    });
}
directive('@if', (v, stack) => {
    validateObjectWithFields(v, {
        exists: { optional: validateDirectiveOrRaw },
        then: { optional: validateDirectiveOrRaw },
        else: { optional: validateDirectiveOrRaw }
    }, stack);
});
directive('@arrayPath', (v, stack) => {
    const data = v;
    validateArray(data, stack);
    validateDirectiveOrString(data[0], stack);
    validate(data[1], stack);
});
directive('@path', (v, stack) => {
    validateDirectiveOrString(v, stack);
});
directive('@template', (v, stack) => {
    validateDirectiveOrString(v, stack);
});
directive('@literal', (v, stack) => {
    validateDirectiveOrRaw(v, stack);
});
function indefiniteArticle(s) {
    switch (s.charAt(0)) {
        case 'a':
        case 'e':
        case 'i':
        case 'o':
        case 'u':
            return 'an';
        default:
            return 'a';
    }
}
function validate(mapping, stack = []) {
    switch (realTypeOrDirective(mapping)) {
        case 'directive':
            return validateDirective(mapping, stack);
        case 'object':
            return validateObject(mapping, stack);
        case 'array':
            return validateArray(mapping, stack);
        default:
            return null;
    }
}
exports.default = validate;
//# sourceMappingURL=validate.js.map