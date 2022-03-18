import { get } from '../get';
import { realTypeOf } from '../real-type-of';
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
export function render(template, data = {}) {
    if (typeof template !== 'string') {
        throw new TypeError(`Invalid template! Template should be a "string" but ${realTypeOf(template)} was given.`);
    }
    function replacer(chars, escape) {
        return (match) => {
            match = match.slice(chars, -chars).trim();
            const value = get(data, match);
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
//# sourceMappingURL=placeholders.js.map