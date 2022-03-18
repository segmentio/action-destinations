"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const trackCustomer_1 = __importDefault(require("./trackCustomer"));
const trackPurchase_1 = __importDefault(require("./trackPurchase"));
const trackSignUp_1 = __importDefault(require("./trackSignUp"));
const trackCustomEvent_1 = __importDefault(require("./trackCustomEvent"));
const cloudUtil_1 = require("./cloudUtil");
const destination = {
    name: 'Friendbuy (Cloud Destination)',
    slug: 'actions-friendbuy-cloud',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            authKey: {
                label: 'Friendbuy MAPI Key',
                description: 'Contact your Friendbuy account manager to generate your Friendbuy MAPI key and secret.',
                type: 'string',
                format: 'uuid',
                required: true
            },
            authSecret: {
                label: 'Friendbuy MAPI Secret',
                description: 'See Friendbuy MAPI Key.',
                type: 'string',
                required: true
            }
        },
        testAuthentication: (request, { settings }) => {
            return request(`${cloudUtil_1.defaultMapiBaseUrl}/v1/authorization`, {
                method: 'POST',
                json: { key: settings.authKey, secret: settings.authSecret }
            });
        }
    },
    onDelete: async (request, { payload }) => {
        return !payload.userId
            ? true
            : request(`${cloudUtil_1.defaultMapiBaseUrl}/v1/user-data`, {
                method: 'DELETE',
                searchParams: {
                    customerId: payload.userId
                }
            });
    },
    actions: {
        trackCustomer: trackCustomer_1.default,
        trackPurchase: trackPurchase_1.default,
        trackSignUp: trackSignUp_1.default,
        trackCustomEvent: trackCustomEvent_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map