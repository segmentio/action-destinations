"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessage = exports.fieldPreamble = void 0;
const util_1 = require("./util");
const formatLabels = {
    'date-time': 'date and time',
    time: 'time',
    date: 'date',
    email: 'email address',
    hostname: 'hostname',
    ipv4: 'IPv4 address',
    ipv6: 'IPv6 address',
    uri: 'URI',
    'uri-reference': 'URI Reference',
    'uri-template': 'URI-template',
    'json-pointer': 'JSON Pointer',
    'relative-json-pointer': 'relative JSON Pointer',
    regex: 'regular expression'
};
const fieldPreamble = ({ instancePath, parentSchema }, { fieldLabels }) => {
    switch (fieldLabels) {
        case 'js':
            if (instancePath === '') {
                return 'the root value';
            }
            return `the value at ${util_1.jsonPath(instancePath).replace(/^\$/, '')}`;
        case 'jsonPath':
            return `the value at ${util_1.jsonPath(instancePath)}`;
        case 'jsonPointer':
        case 'instancePath':
            if (instancePath === '') {
                return 'the root value';
            }
            return `the value at ${instancePath}`;
        case 'title':
            if (parentSchema === null || parentSchema === void 0 ? void 0 : parentSchema.title) {
                return parentSchema.title;
            }
            if (instancePath === '') {
                return 'the root value';
            }
            return `the value at ${instancePath}`;
        default:
            throw new Error(`invalid fieldLabels value: ${fieldLabels}`);
    }
};
exports.fieldPreamble = fieldPreamble;
const getMessage = ({ data, keyword, message, params, parentSchema, schemaPath, instancePath }, { fieldLabels }) => {
    const preamble = exports.fieldPreamble({
        instancePath,
        parentSchema
    }, { fieldLabels });
    if (parentSchema === null || parentSchema === void 0 ? void 0 : parentSchema.errorMessage) {
        return `${preamble} ${parentSchema.errorMessage}`;
    }
    switch (keyword) {
        case 'enum': {
            const list = params.allowedValues.map(JSON.stringify);
            const allowed = util_1.humanizeList(list, 'or');
            return `${preamble} must be one of: ${allowed}`;
        }
        case 'type': {
            const list = Array.isArray(params.type) ? params.type : params.type.split(',');
            const expectType = util_1.humanizeList(list, 'or');
            const gotType = util_1.humanizeTypeOf(data);
            return `${preamble} must be ${util_1.indefiniteArticle(expectType)} ${expectType} but it was ${gotType}`;
        }
        case 'minLength': {
            const limit = params.limit;
            const charsLimit = util_1.pluralize('character', limit);
            const actual = data.length;
            const charsActual = util_1.pluralize('character', actual);
            return `${preamble} must be ${limit} ${charsLimit} or more but it was ${actual} ${charsActual}`;
        }
        case 'maxLength': {
            const limit = params.limit;
            const charsLimit = util_1.pluralize('character', limit);
            const actual = data.length;
            const charsActual = util_1.pluralize('character', actual);
            return `${preamble} must be ${limit} ${charsLimit} or fewer but it was ${actual} ${charsActual}`;
        }
        case 'pattern': {
            if (schemaPath.endsWith('propertyNames/pattern'))
                return null;
            const patternLabel = parentSchema === null || parentSchema === void 0 ? void 0 : parentSchema.patternLabel;
            if (patternLabel) {
                return `${preamble} must be ${patternLabel} but it was not`;
            }
            else {
                return `${preamble} is an invalid string`;
            }
        }
        case 'format': {
            const label = formatLabels[params.format] || params.format;
            return `${preamble} must be a valid ${label} string but it was not`;
        }
        case 'multipleOf': {
            return `${preamble} must be a multiple of ${params.multipleOf}`;
        }
        case 'minimum': {
            return `${preamble} must be equal to or greater than ${params.limit}`;
        }
        case 'exclusiveMinimum': {
            return `${preamble} must be greater than ${params.limit}`;
        }
        case 'maximum': {
            return `${preamble} must be equal to or less than ${params.limit}`;
        }
        case 'exclusiveMaximum': {
            return `${preamble} must be less than ${params.limit}`;
        }
        case 'additionalProperties': {
            const allowed = Object.keys(parentSchema === null || parentSchema === void 0 ? void 0 : parentSchema.properties).join(', ');
            const found = params.additionalProperty;
            return `${preamble} has an unexpected property, ${found}, which is not in the list of allowed properties (${allowed})`;
        }
        case 'required': {
            const missingField = params.missingProperty;
            return `${preamble} is missing the required field '${missingField}'`;
        }
        case 'propertyNames': {
            return `${preamble} has an invalid property name ${JSON.stringify(params.propertyName)}`;
        }
        case 'minProperties': {
            const expected = params.limit;
            const actual = Object.keys(data).length;
            return `${preamble} must have ${expected} or more properties but it has ${actual}`;
        }
        case 'maxProperties': {
            const expected = params.limit;
            const actual = Object.keys(data).length;
            return `${preamble} must have ${expected} or fewer properties but it has ${actual}`;
        }
        case 'dependencies': {
            const prop = params.property;
            const missing = params.missingProperty;
            return `${preamble} must have property ${missing} when ${prop} is present`;
        }
        case 'minItems': {
            const min = params.limit;
            const actual = data.length;
            return `${preamble} must have ${min} or more items but it has ${actual}`;
        }
        case 'maxItems': {
            const max = params.limit;
            const actual = data.length;
            return `${preamble} must have ${max} or fewer items but it has ${actual}`;
        }
        case 'uniqueItems': {
            const { i, j } = params;
            return `${preamble} must be unique but elements ${j} and ${i} are the same`;
        }
        default:
            return `${preamble} ${message}`;
    }
};
exports.getMessage = getMessage;
//# sourceMappingURL=formatting.js.map