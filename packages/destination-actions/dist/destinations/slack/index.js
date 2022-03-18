"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postToChannel_1 = __importDefault(require("./postToChannel"));
const destination = {
    name: 'Slack',
    mode: 'cloud',
    actions: {
        postToChannel: postToChannel_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map