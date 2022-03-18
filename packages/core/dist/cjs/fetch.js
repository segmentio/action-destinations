"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = exports.Request = exports.Headers = void 0;
const cross_fetch_1 = __importStar(require("cross-fetch"));
Object.defineProperty(exports, "Headers", { enumerable: true, get: function () { return cross_fetch_1.Headers; } });
Object.defineProperty(exports, "Request", { enumerable: true, get: function () { return cross_fetch_1.Request; } });
Object.defineProperty(exports, "Response", { enumerable: true, get: function () { return cross_fetch_1.Response; } });
exports.default = cross_fetch_1.default;
//# sourceMappingURL=fetch.js.map