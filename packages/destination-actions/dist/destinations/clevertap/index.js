"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userUpload_1 = __importDefault(require("./userUpload"));
const userDelete_1 = __importDefault(require("./userDelete"));
const destination = {
    name: 'Clevertap (Actions)',
    slug: 'actions-clevertap',
    mode: 'cloud',
    description: 'Send events server-side to Clevertap',
    authentication: {
        scheme: 'custom',
        fields: {
            clevertapAccountId: {
                label: 'CleverTap Account ID',
                description: 'Your CleverTap Account ID.',
                type: 'string',
                required: true
            },
            clevertapPasscode: {
                label: 'CleverTap Account Passcode',
                description: 'Your CleverTap Account Passcode.',
                type: 'string',
                required: true
            },
            clevertapEndpoint: {
                label: 'REST Endpoint',
                description: 'Your Clevertap REST endpoint. [See more details](https://docs.clevertap.com/docs)',
                type: 'string',
                format: 'uri',
                choices: [
                    { label: 'SK', value: 'https://sk1.api.clevertap.com' },
                    { label: 'EU', value: 'https://eu1.api.clevertap.com' },
                    { label: 'US', value: 'https://us1.api.clevertap.com' },
                    { label: 'SG', value: 'https://sg1.api.clevertap.com' },
                    { label: 'IN', value: 'https://in1.api.clevertap.com' }
                ],
                default: 'https://sk1.api.clevertap.com',
                required: true
            }
        }
    },
    actions: {
        userUpload: userUpload_1.default,
        userDelete: userDelete_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map