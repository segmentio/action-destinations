"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sendEvent_1 = __importDefault(require("./sendEvent"));
const sendPageview_1 = __importDefault(require("./sendPageview"));
const sendUserData_1 = __importDefault(require("./sendUserData"));
const destination = {
    name: '1plusX',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            client_id: {
                label: 'Client ID',
                description: 'Your 1plusX Client ID.',
                type: 'string',
                required: true
            },
            use_test_endpoint: {
                label: 'Use Test Endpoint',
                description: 'If true, events are sent to `https://tagger-test.opecloud.com` instead of `https://tagger.opecloud.com`',
                type: 'boolean',
                default: false
            }
        }
    },
    actions: {
        sendEvent: sendEvent_1.default,
        sendPageview: sendPageview_1.default,
        sendUserData: sendUserData_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map