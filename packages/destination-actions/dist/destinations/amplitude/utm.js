"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertUTMProperties = void 0;
function convertUTMProperties(payload) {
    const { utm_properties } = payload;
    if (!utm_properties)
        return {};
    const set = {};
    const setOnce = {};
    Object.entries(utm_properties).forEach(([key, value]) => {
        set[key] = value;
        setOnce[`initial_${key}`] = value;
    });
    return {
        $set: set,
        $setOnce: setOnce
    };
}
exports.convertUTMProperties = convertUTMProperties;
//# sourceMappingURL=utm.js.map