"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringify = exports.mapEventHelper = exports.mapEvent = exports.DROP = exports.COPY = exports.ROOT = void 0;
const actions_core_1 = require("@segment/actions-core");
const util_1 = require("./util");
exports.ROOT = Symbol('ROOT');
exports.COPY = {};
Object.freeze(exports.COPY);
exports.DROP = Symbol('DROP');
function mapEvent(map, analyticsPayload) {
    const friendbuyPayload = mapEventHelper(map, analyticsPayload);
    if (!friendbuyPayload) {
        throw new actions_core_1.IntegrationError('Payload has no supported fields', 'INVALID_REQUEST_DATA', 400);
    }
    return friendbuyPayload;
}
exports.mapEvent = mapEvent;
function mapEventHelper(map, analyticsPayload) {
    if (analyticsPayload.friendbuyAttributes) {
        if (typeof analyticsPayload.friendbuyAttributes === 'object') {
            analyticsPayload = Object.assign({}, analyticsPayload.friendbuyAttributes, analyticsPayload);
        }
        delete analyticsPayload.friendbuyAttributes;
    }
    let friendbuyPayload = Object.assign({}, map.defaultObject);
    for (const [key, rawValue] of Object.entries(analyticsPayload)) {
        const fieldMap = typeof map.fields === 'object' && map.fields[key];
        if (!fieldMap) {
            let value = rawValue;
            if (util_1.isNonEmpty(rawValue)) {
                if (map.unmappedFieldObject) {
                    let unmappedFieldObject = friendbuyPayload;
                    if (map.unmappedFieldObject !== exports.ROOT) {
                        if (typeof friendbuyPayload[map.unmappedFieldObject] !== 'object') {
                            unmappedFieldObject = friendbuyPayload[map.unmappedFieldObject] = {};
                        }
                        else {
                            unmappedFieldObject = friendbuyPayload[map.unmappedFieldObject];
                        }
                        value = stringify(rawValue);
                    }
                    unmappedFieldObject[key] = value;
                }
            }
        }
        else if (fieldMap === exports.DROP) {
        }
        else {
            const name = fieldMap.name || key;
            let value = fieldMap.convert ? fieldMap.convert(rawValue) : rawValue;
            switch (fieldMap.type) {
                case 'object':
                    value = mapEventHelper(fieldMap, value);
                    break;
                case 'array':
                    if (fieldMap.fields) {
                        value = value.reduce((acc, o) => {
                            const v = mapEventHelper(fieldMap, o);
                            if (v !== undefined) {
                                acc.push(v);
                            }
                            return acc;
                        }, []);
                    }
                    break;
                default:
                    break;
            }
            if (util_1.isNonEmpty(value)) {
                if (typeof name === 'string') {
                    friendbuyPayload[name] = value;
                }
                else {
                    let o = friendbuyPayload;
                    for (let i = 0; i < name.length - 1; i++) {
                        if (!(name[i] in o)) {
                            o[name[i]] = {};
                        }
                        o = o[name[i]];
                    }
                    o[name[name.length - 1]] = value;
                }
            }
        }
    }
    if (map.finalize) {
        friendbuyPayload = map.finalize(friendbuyPayload);
    }
    return util_1.isNonEmpty(friendbuyPayload) ? friendbuyPayload : undefined;
}
exports.mapEventHelper = mapEventHelper;
function stringify(rawValue) {
    switch (typeof rawValue) {
        case 'string':
            return rawValue;
        case 'object':
            return JSON.stringify(rawValue);
        default:
            return rawValue.toString();
    }
}
exports.stringify = stringify;
//# sourceMappingURL=mapEvent.js.map