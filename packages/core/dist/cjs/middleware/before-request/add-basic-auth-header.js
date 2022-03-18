"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const btoa_lite_1 = __importDefault(require("btoa-lite"));
const addBasicAuthHeader = (options) => {
    if (options.username || options.password) {
        const username = options.username || '';
        const password = options.password || '';
        const encoded = btoa_lite_1.default(`${username}:${password}`);
        const authorization = `Basic ${encoded}`;
        return {
            headers: {
                Authorization: authorization
            }
        };
    }
};
exports.default = addBasicAuthHeader;
//# sourceMappingURL=add-basic-auth-header.js.map