"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const createAlias_1 = __importDefault(require("./createAlias"));
const identifyUser_1 = __importDefault(require("./identifyUser"));
const trackEvent_1 = __importDefault(require("./trackEvent"));
const trackPurchase_1 = __importDefault(require("./trackPurchase"));
const updateUserProfile_1 = __importDefault(require("./updateUserProfile"));
const destination = {
    name: 'Braze Cloud Mode (Actions)',
    slug: 'actions-braze-cloud',
    mode: 'cloud',
    description: 'Send events server-side to the Braze REST API.',
    authentication: {
        scheme: 'custom',
        fields: {
            api_key: {
                label: 'API Key',
                description: 'Created under Developer Console in the Braze Dashboard.',
                type: 'password',
                required: true
            },
            app_id: {
                label: 'App ID',
                description: 'The app identifier used to reference specific Apps in requests made to the Braze API. Created under Developer Console in the Braze Dashboard.',
                type: 'string',
                required: true
            },
            endpoint: {
                label: 'REST Endpoint',
                description: 'Your Braze REST endpoint. [See more details](https://www.braze.com/docs/api/basics/#endpoints)',
                type: 'string',
                format: 'uri',
                choices: [
                    { label: 'US-01	(https://dashboard-01.braze.com)', value: 'https://rest.iad-01.braze.com' },
                    { label: 'US-02	(https://dashboard-02.braze.com)', value: 'https://rest.iad-02.braze.com' },
                    { label: 'US-03	(https://dashboard-03.braze.com)', value: 'https://rest.iad-03.braze.com' },
                    { label: 'US-04	(https://dashboard-04.braze.com)', value: 'https://rest.iad-04.braze.com' },
                    { label: 'US-05	(https://dashboard-05.braze.com)', value: 'https://rest.iad-05.braze.com' },
                    { label: 'US-06	(https://dashboard-06.braze.com)', value: 'https://rest.iad-06.braze.com' },
                    { label: 'US-08	(https://dashboard-08.braze.com)', value: 'https://rest.iad-08.braze.com' },
                    { label: 'EU-01	(https://dashboard-01.braze.eu)', value: 'https://rest.fra-01.braze.eu' }
                ],
                default: 'https://rest.iad-01.braze.com',
                required: true
            }
        }
    },
    onDelete: async (request, { payload }) => {
        return request('https://rest.iad-01.braze.com/users/delete', {
            method: 'post',
            json: {
                external_ids: [payload.userId]
            }
        });
    },
    extendRequest({ settings }) {
        return {
            headers: {
                Authorization: `Bearer ${settings.api_key}`
            }
        };
    },
    actions: {
        updateUserProfile: updateUserProfile_1.default,
        trackEvent: trackEvent_1.default,
        trackPurchase: trackPurchase_1.default,
        createAlias: createAlias_1.default,
        identifyUser: identifyUser_1.default
    },
    presets: [
        {
            name: 'Track Calls',
            subscribe: 'type = "track" and event != "Order Completed"',
            partnerAction: 'trackEvent',
            mapping: actions_core_1.defaultValues(trackEvent_1.default.fields)
        },
        {
            name: 'Order Completed Calls',
            subscribe: 'event = "Order Completed"',
            partnerAction: 'trackPurchase',
            mapping: actions_core_1.defaultValues(trackPurchase_1.default.fields)
        },
        {
            name: 'Identify Calls',
            subscribe: 'type = "identify"',
            partnerAction: 'updateUserProfile',
            mapping: actions_core_1.defaultValues(updateUserProfile_1.default.fields)
        }
    ]
};
exports.default = destination;
//# sourceMappingURL=index.js.map