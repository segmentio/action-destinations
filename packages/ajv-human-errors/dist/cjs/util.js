"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.humanizeList = exports.humanizeTypeOf = exports.indefiniteArticle = exports.humanizePath = exports.jsonPath = exports.pluralize = exports.capitalize = void 0;
const capitalize = (s) => {
    if (typeof s !== 'string' || s.length === 0) {
        return s;
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
};
exports.capitalize = capitalize;
const pluralize = (s, num) => {
    if (num === 1) {
        return s;
    }
    return `${s}s`;
};
exports.pluralize = pluralize;
const jsonPath = (s) => {
    if (s === '') {
        return '$';
    }
    const path = s
        .substring(1)
        .split(/\//)
        .map(s => {
        return s.replace(/~1/g, '/').replace(/~0/g, '~').replace(/\./g, '\\.');
    })
        .map(s => {
        if (/^\d+$/.exec(s)) {
            return `[${s}]`;
        }
        return `.${s}`;
    }).join('');
    return '$' + path;
};
exports.jsonPath = jsonPath;
const humanizePath = (s) => {
    if (s === '') {
        return 'the root value';
    }
    return `the value at ${exports.jsonPath(s)}`;
};
exports.humanizePath = humanizePath;
const indefiniteArticle = (s) => {
    switch (s[0]) {
        case 'a':
        case 'e':
        case 'i':
        case 'o':
        case 'u':
            return 'an';
        default:
            return 'a';
    }
};
exports.indefiniteArticle = indefiniteArticle;
const humanizeTypeOf = (value) => {
    const raw = typeof value;
    switch (raw) {
        case 'object':
            if (value === null) {
                return 'null';
            }
            if (Array.isArray(value)) {
                return 'an array';
            }
            return 'an object';
        case 'undefined':
            return 'undefined';
        default:
            return `${exports.indefiniteArticle(raw)} ${raw}`;
    }
};
exports.humanizeTypeOf = humanizeTypeOf;
const humanizeList = (arr, conjunction = 'and') => {
    if (arr.length === 0) {
        return 'nothing';
    }
    if (arr.length === 1) {
        return arr[0];
    }
    if (arr.length === 2) {
        return `${arr[0]} ${conjunction} ${arr[1]}`;
    }
    return `${arr.slice(0, -1).join(', ')}, ${conjunction} ${arr[arr.length - 1]}`;
};
exports.humanizeList = humanizeList;
//# sourceMappingURL=util.js.map