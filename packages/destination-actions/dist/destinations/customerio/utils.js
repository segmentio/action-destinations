"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertAttributeTimestamps = exports.convertValidTimestamp = exports.AccountRegion = exports.trackApiEndpoint = void 0;
const dayjs_1 = __importDefault(require("../../lib/dayjs"));
const isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
const trackApiEndpoint = (accountRegion) => {
    if (accountRegion === AccountRegion.EU) {
        return 'https://track-eu.customer.io';
    }
    return 'https://track.customer.io';
};
exports.trackApiEndpoint = trackApiEndpoint;
var AccountRegion;
(function (AccountRegion) {
    AccountRegion["US"] = "US \uD83C\uDDFA\uD83C\uDDF8";
    AccountRegion["EU"] = "EU \uD83C\uDDEA\uD83C\uDDFA";
})(AccountRegion = exports.AccountRegion || (exports.AccountRegion = {}));
const isRecord = (value) => {
    return isPlainObject_1.default(value);
};
const isIsoDate = (value) => {
    const isoformat = '^\\d{4}-\\d{2}-\\d{2}' +
        '((T\\d{2}:\\d{2}(:\\d{2})?)' +
        '(\\.\\d{1,6})?' +
        '(Z|(\\+|-)\\d{2}:?\\d{2})?)?$';
    const matcher = new RegExp(isoformat);
    return typeof value === 'string' && matcher.test(value) && !isNaN(Date.parse(value));
};
const convertValidTimestamp = (value) => {
    if (typeof value !== 'string' || /^\d+$/.test(value)) {
        return value;
    }
    const maybeDate = dayjs_1.default.utc(value);
    if (maybeDate.isValid()) {
        return maybeDate.unix();
    }
    return value;
};
exports.convertValidTimestamp = convertValidTimestamp;
const convertAttributeTimestamps = (payload) => {
    const clone = {};
    const keys = Object.keys(payload);
    keys.forEach((key) => {
        const value = payload[key];
        if (typeof value === 'string') {
            const maybeDate = dayjs_1.default(value);
            if (isIsoDate(value)) {
                clone[key] = maybeDate.unix();
                return;
            }
        }
        if (isRecord(value)) {
            clone[key] = exports.convertAttributeTimestamps(value);
            return;
        }
        clone[key] = value;
    });
    return clone;
};
exports.convertAttributeTimestamps = convertAttributeTimestamps;
//# sourceMappingURL=utils.js.map