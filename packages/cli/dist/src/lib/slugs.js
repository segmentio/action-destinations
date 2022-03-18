"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = void 0;
const tslib_1 = require("tslib");
const slugify_1 = tslib_1.__importDefault(require("slugify"));
function generateSlug(name) {
    return slugify_1.default(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
}
exports.generateSlug = generateSlug;
//# sourceMappingURL=slugs.js.map