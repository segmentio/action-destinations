"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const trackOrderPlaced_1 = __importDefault(require("./trackOrderPlaced"));
const destination = {
    name: 'Voyage',
    slug: 'actions-voyage',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            apiKey: {
                label: 'API Key',
                description: 'Voyage API key. You can create a new API key or find your existing API key in the Advanced section of your [Settings page](https://app.voyagetext.com/dashboard/settings/advanced).',
                type: 'string',
                required: true
            }
        },
    },
    extendRequest: ({ settings }) => {
        return {
            headers: {
                'x-api-key': settings.apiKey
            }
        };
    },
    presets: [
        {
            name: 'Track Order Placed Event',
            subscribe: 'type = "track"',
            partnerAction: 'trackOrderPlaced',
            mapping: actions_core_1.defaultValues(trackOrderPlaced_1.default.fields)
        }
    ],
    actions: {
        trackOrderPlaced: trackOrderPlaced_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map