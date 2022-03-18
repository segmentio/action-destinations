"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const createAudience_1 = __importDefault(require("./createAudience"));
const updateAudience_1 = __importDefault(require("./updateAudience"));
const deleteAudience_1 = __importDefault(require("./deleteAudience"));
const updateCustomerProfile_1 = __importDefault(require("./updateCustomerProfile"));
const updateCustomerProfilesAttributes_1 = __importDefault(require("./updateCustomerProfilesAttributes"));
const updateCustomerProfilesAudiences_1 = __importDefault(require("./updateCustomerProfilesAudiences"));
const trackEvent_1 = __importDefault(require("./trackEvent"));
const destination = {
    name: 'Talon.One (Actions)',
    slug: 'actions-talon-one',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            apiKey: {
                label: 'API Key',
                description: 'Created under Developer Settings in the Talon.One Campaign Manager.',
                type: 'string',
                required: true
            },
            deployment: {
                type: 'string',
                label: 'Deployment',
                description: 'The base URL of your Talon.One deployment.',
                required: true
            }
        },
        testAuthentication: (request, { settings }) => {
            return request(`${settings.deployment}/v2/authping`, { method: 'GET' });
        }
    },
    extendRequest({ settings }) {
        return {
            headers: {
                Authorization: `ApiKey-v1 ${settings.apiKey}`,
                'destination-hostname': `${settings.deployment}`
            }
        };
    },
    actions: {
        createAudience: createAudience_1.default,
        updateAudience: updateAudience_1.default,
        deleteAudience: deleteAudience_1.default,
        updateCustomerProfile: updateCustomerProfile_1.default,
        updateCustomerProfilesAttributes: updateCustomerProfilesAttributes_1.default,
        updateCustomerProfilesAudiences: updateCustomerProfilesAudiences_1.default,
        trackEvent: trackEvent_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map