"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
const get_1 = require("../get");
const real_type_of_1 = require("../real-type-of");
const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};
function escapeHtml(value) {
    if (typeof value !== 'string')
        return value;
    return value.replace(/[&<>"'`=/]/g, (match) => {
        return entityMap[match];
    });
}
function render(template, data = {}) {
    if (typeof template !== 'string') {
        throw new TypeError(`Invalid template! Template should be a "string" but ${real_type_of_1.realTypeOf(template)} was given.`);
    }
    function replacer(chars, escape) {
        return (match) => {
            match = match.slice(chars, -chars).trim();
            const value = get_1.get(data, match);
            if (escape) {
                return String(escapeHtml(value) ?? '');
            }
            return (value ?? '');
        };
    }
    return (template
        .replace(/\{\{\{([^}]+)\}\}\}/g, replacer(3, false))
        .replace(/\{\{([^}]+)\}\}/g, replacer(2, true)));
}
exports.render = render;
//# sourceMappingURL=placeholders.js.map