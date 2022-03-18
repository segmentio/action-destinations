"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const sendEvent_1 = __importDefault(require("./sendEvent"));
const destination = {
    name: 'Metronome (Actions)',
    mode: 'cloud',
    slug: 'metronome-actions',
    authentication: {
        scheme: 'custom',
        fields: {
            apiToken: {
                type: 'string',
                label: 'API Token',
                description: 'Your Metronome API Token',
                required: true
            }
        },
        testAuthentication: async (request) => {
            const response = await request('https://api.metronome.com/v1/ingest', {
                method: 'post',
                json: [],
                throwHttpErrors: false
            });
            if (response.status === 400) {
                return true;
            }
            throw new Error('Invalid API Token');
        }
    },
    extendRequest: ({ settings }) => {
        return {
            headers: { Authorization: `Bearer ${settings.apiToken}` }
        };
    },
    actions: {
        sendEvent: sendEvent_1.default
    },
    presets: [
        {
            name: 'Send track events to Metronome',
            subscribe: 'type = "track"',
            partnerAction: 'sendEvent',
            mapping: actions_core_1.defaultValues(sendEvent_1.default.fields)
        }
    ]
};
exports.default = destination;
//# sourceMappingURL=index.js.map