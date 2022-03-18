"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRegion = exports.formatCity = exports.formatStreet = exports.formatLastName = exports.formatFirstName = exports.formatPhone = exports.formatEmail = exports.cleanData = void 0;
const crypto_1 = require("crypto");
function cleanData(data) {
    if (data == null) {
        return {};
    }
    const obj = {};
    for (const key in data) {
        const value = data[key];
        if (Array.isArray(value)) {
            const filtered = value.filter((item) => item);
            if (filtered.length !== 0) {
                obj[key] = filtered;
            }
        }
        else if (value) {
            obj[key] = value;
        }
    }
    return obj;
}
exports.cleanData = cleanData;
function formatEmail(email) {
    let formattedEmail;
    if (email.toLowerCase().search('@gmail') > -1 || email.toLowerCase().search('@googlemail.com') > -1) {
        formattedEmail = email.toLowerCase().replace(/ /g, '');
        const name = formattedEmail.substr(0, formattedEmail.indexOf('@')).replace(/\./g, '');
        const domain = formattedEmail.substr(formattedEmail.indexOf('@'), formattedEmail.length);
        return hashAndEncode(name.concat(domain));
    }
    else {
        return hashAndEncode(email.toLowerCase().replace(/ /g, ''));
    }
}
exports.formatEmail = formatEmail;
function formatPhone(phone) {
    if (!phone)
        return '';
    const validatedPhone = phone.match(/[0-9]{0,14}/g);
    if (validatedPhone === null) {
        throw new Error(`${phone} is not a valid E.164 phone number.`);
    }
    let formattedPhone = `+${phone.replace(/[^0-9]/g, '')}`;
    formattedPhone = formattedPhone.substring(0, 15);
    return hashAndEncode(formattedPhone);
}
exports.formatPhone = formatPhone;
function formatFirstName(firstName) {
    if (!firstName)
        return '';
    return hashAndEncode(firstName.toLowerCase().replace(/[^a-z]/g, ''));
}
exports.formatFirstName = formatFirstName;
function formatLastName(lastName) {
    if (!lastName)
        return '';
    return hashAndEncode(lastName.toLowerCase().replace(/[^a-z]/g, ''));
}
exports.formatLastName = formatLastName;
function formatStreet(street) {
    if (!street)
        return '';
    return hashAndEncode(street.toLowerCase());
}
exports.formatStreet = formatStreet;
function formatCity(city) {
    if (!city)
        return '';
    return city.toLowerCase().replace(/[^a-z]/g, '');
}
exports.formatCity = formatCity;
function formatRegion(region) {
    if (!region)
        return '';
    return region.toLowerCase().replace(/[^a-z]/g, '');
}
exports.formatRegion = formatRegion;
function hashAndEncode(property) {
    return crypto_1.createHash('sha256').update(property).digest('base64').replace(/\//g, '_').replace(/\+/g, '-');
}
//# sourceMappingURL=formatter.js.map