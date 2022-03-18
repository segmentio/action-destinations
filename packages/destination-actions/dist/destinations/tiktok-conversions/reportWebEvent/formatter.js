"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPhone = exports.formatUserId = exports.formatEmail = void 0;
const crypto_1 = require("crypto");
function formatEmail(email) {
    if (email) {
        return hashAndEncode(email.toLowerCase());
    }
    return undefined;
}
exports.formatEmail = formatEmail;
function formatUserId(userId) {
    if (userId) {
        return hashAndEncode(userId.toLowerCase().trim());
    }
    return undefined;
}
exports.formatUserId = formatUserId;
function formatPhone(phone) {
    if (!phone)
        return undefined;
    const validatedPhone = phone.match(/[0-9]{0,14}/g);
    if (validatedPhone === null) {
        throw new Error(`${phone} is not a valid E.164 phone number.`);
    }
    let formattedPhone = `+${phone.replace(/[^0-9]/g, '')}`;
    formattedPhone = formattedPhone.substring(0, 15);
    return hashAndEncode(formattedPhone);
}
exports.formatPhone = formatPhone;
function hashAndEncode(property) {
    return crypto_1.createHash('sha256').update(property).digest('hex');
}
//# sourceMappingURL=formatter.js.map