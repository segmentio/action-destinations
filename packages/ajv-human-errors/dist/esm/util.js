export const capitalize = (s) => {
    if (typeof s !== 'string' || s.length === 0) {
        return s;
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
};
export const pluralize = (s, num) => {
    if (num === 1) {
        return s;
    }
    return `${s}s`;
};
export const jsonPath = (s) => {
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
export const humanizePath = (s) => {
    if (s === '') {
        return 'the root value';
    }
    return `the value at ${jsonPath(s)}`;
};
export const indefiniteArticle = (s) => {
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
export const humanizeTypeOf = (value) => {
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
            return `${indefiniteArticle(raw)} ${raw}`;
    }
};
export const humanizeList = (arr, conjunction = 'and') => {
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
//# sourceMappingURL=util.js.map