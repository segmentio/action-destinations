"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function asyncHandler(fn) {
    return async (req, res, next) => {
        return fn(req, res, next).catch(next);
    };
}
exports.default = asyncHandler;
//# sourceMappingURL=async-handler.js.map