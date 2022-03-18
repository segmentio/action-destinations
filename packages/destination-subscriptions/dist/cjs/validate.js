"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_1 = require("./get");
const validateGroupCondition = (condition, data) => {
    if (condition.operator === 'and') {
        return condition.children.every((childCondition) => {
            return validateCondition(childCondition, data);
        });
    }
    if (condition.operator === 'or') {
        return condition.children.some((childCondition) => {
            return validateCondition(childCondition, data);
        });
    }
    return false;
};
const validate = (condition, data) => {
    if (condition.error || typeof data === 'undefined') {
        return false;
    }
    return validateGroupCondition(condition, data);
};
exports.default = validate;
const validateCondition = (condition, data) => {
    if (condition.type === 'event-type') {
        return validateValue(data.type, condition.operator, condition.value);
    }
    if (condition.type === 'event') {
        return validateValue(data.event, condition.operator, condition.value);
    }
    if (condition.type === 'name') {
        return validateValue(data.name, condition.operator, condition.value);
    }
    if (condition.type === 'userId') {
        return validateValue(data.userId, condition.operator, condition.value);
    }
    if (condition.type === 'event-property') {
        return validateValue(get_1.get(data.properties, condition.name), condition.operator, condition.value);
    }
    if (condition.type === 'event-trait') {
        return validateValue(get_1.get(data.traits, condition.name), condition.operator, condition.value);
    }
    if (condition.type === 'event-context') {
        return validateValue(get_1.get(data.context, condition.name), condition.operator, condition.value);
    }
    if (condition.type === 'group') {
        return validateGroupCondition(condition, data);
    }
    return false;
};
const validateValue = (actual, operator, expected) => {
    switch (operator) {
        case '=':
            return String(actual) === String(expected);
        case '!=':
            return String(actual) !== String(expected);
        case '<':
            return Number(actual) < Number(expected);
        case '<=':
            return Number(actual) <= Number(expected);
        case '>':
            return Number(actual) > Number(expected);
        case '>=':
            return Number(actual) >= Number(expected);
        case 'contains':
            return typeof actual === 'string' && actual.includes(String(expected));
        case 'not_contains':
            return typeof actual === 'string' && !actual.includes(String(expected));
        case 'starts_with':
            return typeof actual === 'string' && actual.startsWith(String(expected));
        case 'not_starts_with':
            return typeof actual === 'string' && !actual.startsWith(String(expected));
        case 'ends_with':
            return typeof actual === 'string' && actual.endsWith(String(expected));
        case 'not_ends_with':
            return typeof actual === 'string' && !actual.endsWith(String(expected));
        case 'exists':
            return actual !== undefined && actual !== null;
        case 'not_exists':
            return actual === undefined || actual === null;
        default:
            return false;
    }
};
//# sourceMappingURL=validate.js.map