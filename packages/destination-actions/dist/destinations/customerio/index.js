"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const createUpdateDevice_1 = __importDefault(require("./createUpdateDevice"));
const deleteDevice_1 = __importDefault(require("./deleteDevice"));
const createUpdatePerson_1 = __importDefault(require("./createUpdatePerson"));
const trackEvent_1 = __importDefault(require("./trackEvent"));
const trackPageView_1 = __importDefault(require("./trackPageView"));
const trackScreenView_1 = __importDefault(require("./trackScreenView"));
const utils_1 = require("./utils");
const destination = {
    name: 'Actions Customerio',
    mode: 'cloud',
    authentication: {
        scheme: 'basic',
        fields: {
            siteId: {
                description: 'Customer.io site ID. This can be found on your [API Credentials page](https://fly.customer.io/settings/api_credentials).',
                label: 'Site ID',
                type: 'string',
                required: true
            },
            apiKey: {
                description: 'Customer.io API key. This can be found on your [API Credentials page](https://fly.customer.io/settings/api_credentials).',
                label: 'API Key',
                type: 'string',
                required: true
            },
            accountRegion: {
                description: 'Learn about [Account Regions](https://customer.io/docs/data-centers/).',
                label: 'Account Region',
                type: 'string',
                choices: Object.values(utils_1.AccountRegion).map((dc) => ({ label: dc, value: dc })),
                default: utils_1.AccountRegion.US
            }
        },
        testAuthentication: (request) => {
            return request('https://track.customer.io/auth');
        }
    },
    extendRequest({ settings }) {
        return {
            username: settings.siteId,
            password: settings.apiKey
        };
    },
    actions: {
        createUpdateDevice: createUpdateDevice_1.default,
        deleteDevice: deleteDevice_1.default,
        createUpdatePerson: createUpdatePerson_1.default,
        trackEvent: trackEvent_1.default,
        trackPageView: trackPageView_1.default,
        trackScreenView: trackScreenView_1.default
    },
    presets: [
        {
            name: 'Create or Update Person',
            subscribe: 'type = "identify"',
            partnerAction: 'createUpdatePerson',
            mapping: actions_core_1.defaultValues(createUpdatePerson_1.default.fields)
        },
        {
            name: 'Create or Update Device',
            subscribe: 'event = "Application Installed" or event = "Application Opened"',
            partnerAction: 'createUpdateDevice',
            mapping: actions_core_1.defaultValues(createUpdateDevice_1.default.fields)
        },
        {
            name: 'Delete Device',
            subscribe: 'event = "Application Uninstalled"',
            partnerAction: 'deleteDevice',
            mapping: actions_core_1.defaultValues(deleteDevice_1.default.fields)
        },
        {
            name: 'Track Event',
            subscribe: 'type = "track"',
            partnerAction: 'trackEvent',
            mapping: actions_core_1.defaultValues(trackEvent_1.default.fields)
        },
        {
            name: 'Track Page View',
            subscribe: 'type = "page"',
            partnerAction: 'trackPageView',
            mapping: actions_core_1.defaultValues(trackPageView_1.default.fields)
        },
        {
            name: 'Track Screen View',
            subscribe: 'type = "screen"',
            partnerAction: 'trackScreenView',
            mapping: actions_core_1.defaultValues(trackScreenView_1.default.fields)
        }
    ],
    onDelete(request, { settings, payload }) {
        const { accountRegion } = settings;
        const { userId } = payload;
        const url = `${utils_1.trackApiEndpoint(accountRegion)}/api/v1/customers/${userId}`;
        return request(url, {
            method: 'DELETE'
        });
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map