"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const actions_core_2 = require("@segment/actions-core");
const regional_endpoints_1 = require("./regional-endpoints");
const identifyUser_1 = __importDefault(require("./identifyUser"));
const groupIdentify_1 = __importDefault(require("./groupIdentify"));
const trackEvent_1 = __importDefault(require("./trackEvent"));
const trackPageView_1 = __importDefault(require("./trackPageView"));
const presets = [
    {
        name: 'Identify User',
        subscribe: 'type = "identify"',
        partnerAction: 'identifyUser',
        mapping: actions_core_2.defaultValues(identifyUser_1.default.fields)
    },
    {
        name: 'Group User',
        subscribe: 'type = "group"',
        partnerAction: 'groupIdentify',
        mapping: actions_core_2.defaultValues(groupIdentify_1.default.fields)
    },
    {
        name: 'Track Event',
        subscribe: 'type = "track"',
        partnerAction: 'trackEvent',
        mapping: actions_core_2.defaultValues(trackEvent_1.default.fields)
    },
    {
        name: 'Track Page View',
        subscribe: 'type = "page"',
        partnerAction: 'trackPageView',
        mapping: actions_core_2.defaultValues(trackPageView_1.default.fields)
    }
];
const destination = {
    name: 'Gainsight PX Cloud (Actions)',
    slug: 'actions-gainsight-px-cloud',
    mode: 'cloud',
    authentication: {
        scheme: 'basic',
        fields: {
            apiKey: {
                label: 'API Key',
                description: 'Gainsight PX API key. You can find this key in the "Administration/Products" screen.',
                type: 'string',
                required: true
            },
            dataCenter: {
                label: 'Data center',
                description: 'The PX data center where your PX subscription is hosted.',
                type: 'string',
                format: 'text',
                required: true,
                choices: [
                    {
                        label: 'North America',
                        value: 'north_america'
                    },
                    {
                        label: 'Europe',
                        value: 'europe'
                    },
                    {
                        label: 'US2',
                        value: 'us2'
                    }
                ]
            }
        },
        testAuthentication: async (request, { settings }) => {
            const endpoint = regional_endpoints_1.getEndpointByRegion('track', settings.dataCenter);
            const response = await request(endpoint, {
                method: 'post',
                username: settings.apiKey,
                password: '',
                json: [],
                throwHttpErrors: false
            });
            if (response.status === 400) {
                return true;
            }
            throw new actions_core_1.IntegrationError('Invalid API key', 'Invalid API Key', 401);
        }
    },
    extendRequest({ settings }) {
        return {
            username: settings.apiKey,
            password: ''
        };
    },
    presets,
    actions: {
        identifyUser: identifyUser_1.default,
        groupIdentify: groupIdentify_1.default,
        trackEvent: trackEvent_1.default,
        trackPageView: trackPageView_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map