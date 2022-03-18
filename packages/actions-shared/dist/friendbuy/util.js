"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enjoinString = exports.enjoinNumber = exports.enjoinInteger = exports.parseDate = exports.filterFriendbuyAttributes = exports.createFriendbuyPayload = exports.isNonEmpty = exports.moveEventPropertiesToRoot = exports.removeCustomerIfNoId = exports.addName = exports.getName = void 0;
function getName(payload) {
    return (payload.name ? payload.name :
        payload.firstName && payload.lastName ? `${payload.firstName} ${payload.lastName}`
            : undefined);
}
exports.getName = getName;
function addName(payload) {
    if (typeof payload === 'object' && !payload.name && payload.firstName && payload.lastName) {
        payload.name = `${payload.firstName} ${payload.lastName}`;
    }
}
exports.addName = addName;
function removeCustomerIfNoId(payload) {
    if (typeof payload !== 'object' || typeof payload.customer !== 'object' || payload.customer.id) {
        return payload;
    }
    payload = { ...payload };
    delete payload.customer;
    return payload;
}
exports.removeCustomerIfNoId = removeCustomerIfNoId;
function moveEventPropertiesToRoot(payload) {
    if (typeof payload !== 'object' || typeof payload.eventProperties !== 'object') {
        return payload;
    }
    const analyticsPayload = {
        ...(payload.eventProperties || {}),
        ...payload
    };
    delete analyticsPayload.eventProperties;
    return analyticsPayload;
}
exports.moveEventPropertiesToRoot = moveEventPropertiesToRoot;
function isNonEmpty(o) {
    if (o === undefined || o === '') {
        return false;
    }
    if (typeof o !== 'object') {
        return true;
    }
    for (const _e in o) {
        return true;
    }
    if (o === null) {
        return true;
    }
    return false;
}
exports.isNonEmpty = isNonEmpty;
function createFriendbuyPayload(payloadItems, flags = {}) {
    const friendbuyPayload = {};
    payloadItems.forEach(([k, v]) => {
        if (!(v === undefined || v === '' || (flags.dropEmpty && !isNonEmpty(v)))) {
            friendbuyPayload[k] = v;
        }
    });
    return friendbuyPayload;
}
exports.createFriendbuyPayload = createFriendbuyPayload;
function filterFriendbuyAttributes(api, friendbuyAttributes) {
    const filteredAttributes = [];
    if (friendbuyAttributes) {
        Object.entries(friendbuyAttributes).forEach((attribute) => {
            if (typeof attribute[1] === 'string') {
                if (attribute[0] === 'birthday') {
                    const dateRecord = parseDate(attribute[1]);
                    if (dateRecord) {
                        filteredAttributes.push([attribute[0], dateRecord]);
                    }
                }
                else {
                    filteredAttributes.push(attribute);
                }
            }
        });
    }
    return (filteredAttributes.length === 0 ? [] :
        api === 'mapi' ? [['additionalProperties', createFriendbuyPayload(filteredAttributes)]]
            : filteredAttributes);
}
exports.filterFriendbuyAttributes = filterFriendbuyAttributes;
const dateRegexp = /^(?:(\d\d\d\d)-)?(\d\d)-(\d\d)(?:[^\d]|$)/;
function parseDate(date) {
    if (typeof date === 'object' &&
        (!('year' in date) || typeof date.year === 'number') &&
        typeof date.month === 'number' &&
        typeof date.day === 'number') {
        return date;
    }
    if (typeof date !== 'string') {
        return undefined;
    }
    const match = dateRegexp.exec(date);
    if (!match) {
        return undefined;
    }
    const year = match[1] && match[1] !== '0000' ? { year: parseInt(match[1], 10) } : {};
    return { month: parseInt(match[2], 10), day: parseInt(match[3], 10), ...year };
}
exports.parseDate = parseDate;
const integerRegexp = /^-?(?:0|[1-9][0-9]*)$/;
const floatRegexp = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
function enjoinInteger(input) {
    return typeof input === 'string' && integerRegexp.test(input) ? parseInt(input) : input;
}
exports.enjoinInteger = enjoinInteger;
function enjoinNumber(input) {
    return typeof input === 'string' && floatRegexp.test(input) ? parseFloat(input) : input;
}
exports.enjoinNumber = enjoinNumber;
function enjoinString(input) {
    return typeof input === 'number' ? input.toString() : input;
}
exports.enjoinString = enjoinString;
//# sourceMappingURL=util.js.map