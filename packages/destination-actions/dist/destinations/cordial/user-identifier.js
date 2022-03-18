"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIdentifier = void 0;
function getUserIdentifier(identifyByKey, identifyByValue) {
    return {
        [identifyByKey]: identifyByValue,
        identifyBy: [identifyByKey]
    };
}
exports.getUserIdentifier = getUserIdentifier;
//# sourceMappingURL=user-identifier.js.map