"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAlias = exports.isValidUserAlias = void 0;
function isValidUserAlias(userAlias) {
    if (userAlias && typeof userAlias === 'object' && userAlias.alias_label && userAlias.alias_name) {
        return true;
    }
    return false;
}
exports.isValidUserAlias = isValidUserAlias;
function getUserAlias(alias) {
    if (isValidUserAlias(alias)) {
        return {
            alias_label: alias.alias_label,
            alias_name: alias.alias_name
        };
    }
    return undefined;
}
exports.getUserAlias = getUserAlias;
//# sourceMappingURL=userAlias.js.map