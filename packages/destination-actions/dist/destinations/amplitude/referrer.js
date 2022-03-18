"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertReferrerProperty = void 0;
function convertReferrerProperty(payload) {
    const { referrer } = payload;
    if (!referrer)
        return {};
    return {
        $set: { referrer },
        $setOnce: { initial_referrer: referrer }
    };
}
exports.convertReferrerProperty = convertReferrerProperty;
//# sourceMappingURL=referrer.js.map