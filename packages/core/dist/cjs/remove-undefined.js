"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUndefined = void 0;
const real_type_of_1 = require("./real-type-of");
function removeUndefined(value) {
    if (Array.isArray(value)) {
        return value.map((item) => removeUndefined(item));
    }
    else if (real_type_of_1.isObject(value)) {
        const cleaned = Object.assign({}, value);
        Object.keys(cleaned).forEach((key) => {
            if (cleaned[key] === undefined) {
                delete cleaned[key];
            }
            else {
                cleaned[key] = removeUndefined(cleaned[key]);
            }
        });
        return cleaned;
    }
    return value;
}
exports.removeUndefined = removeUndefined;
//# sourceMappingURL=remove-undefined.js.map