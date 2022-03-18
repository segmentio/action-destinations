"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRequireCache = void 0;
function clearRequireCache() {
    Object.keys(require.cache).forEach((key) => {
        delete require.cache[key];
    });
}
exports.clearRequireCache = clearRequireCache;
//# sourceMappingURL=require-cache.js.map