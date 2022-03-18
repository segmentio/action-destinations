"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const send_1 = __importDefault(require("./send"));
const destination = {
    name: 'Webhook',
    slug: 'actions-webhook',
    mode: 'cloud',
    actions: {
        send: send_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map