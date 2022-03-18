"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const identifyUser_1 = __importDefault(require("./identifyUser"));
const logEvent_1 = __importDefault(require("./logEvent"));
const mapUser_1 = __importDefault(require("./mapUser"));
const groupIdentifyUser_1 = __importDefault(require("./groupIdentifyUser"));
const regional_endpoints_1 = require("./regional-endpoints");
const presets = [
    {
        name: 'Track Calls',
        subscribe: 'type = "track"',
        partnerAction: 'logEvent',
        mapping: actions_core_1.defaultValues(logEvent_1.default.fields)
    },
    {
        name: 'Page Calls',
        subscribe: 'type = "page"',
        partnerAction: 'logEvent',
        mapping: {
            ...actions_core_1.defaultValues(logEvent_1.default.fields),
            event_type: {
                '@template': 'Viewed {{name}}'
            }
        }
    },
    {
        name: 'Screen Calls',
        subscribe: 'type = "screen"',
        partnerAction: 'logEvent',
        mapping: {
            ...actions_core_1.defaultValues(logEvent_1.default.fields),
            event_type: {
                '@template': 'Viewed {{name}}'
            }
        }
    },
    {
        name: 'Identify Calls',
        subscribe: 'type = "identify"',
        partnerAction: 'identifyUser',
        mapping: actions_core_1.defaultValues(identifyUser_1.default.fields)
    },
    {
        name: 'Browser Session Tracking',
        subscribe: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
        partnerAction: 'sessionId',
        mapping: {}
    }
];
const destination = {
    name: 'Actions Amplitude',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            apiKey: {
                label: 'API Key',
                description: 'Amplitude project API key. You can find this key in the "General" tab of your Amplitude project.',
                type: 'string',
                required: true
            },
            secretKey: {
                label: 'Secret Key',
                description: 'Amplitude project secret key. You can find this key in the "General" tab of your Amplitude project.',
                type: 'string',
                required: true
            },
            endpoint: {
                label: 'Endpoint Region',
                description: 'The region to send your data.',
                type: 'string',
                format: 'text',
                choices: [
                    {
                        label: 'North America',
                        value: 'north_america'
                    },
                    {
                        label: 'Europe',
                        value: 'europe'
                    }
                ],
                default: 'north_america'
            }
        },
        testAuthentication: (request, { settings }) => {
            const endpoint = regional_endpoints_1.getEndpointByRegion('usersearch', settings.endpoint);
            return request(`${endpoint}?user=testUser@example.com`, {
                username: settings.apiKey,
                password: settings.secretKey
            });
        }
    },
    onDelete: async (request, { settings, payload }) => {
        return request(regional_endpoints_1.getEndpointByRegion('deletions', settings.endpoint), {
            username: settings.apiKey,
            password: settings.secretKey,
            method: 'post',
            json: {
                user_ids: [payload.userId],
                requester: 'segment'
            }
        });
    },
    presets,
    actions: {
        logEvent: logEvent_1.default,
        identifyUser: identifyUser_1.default,
        mapUser: mapUser_1.default,
        groupIdentifyUser: groupIdentifyUser_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map