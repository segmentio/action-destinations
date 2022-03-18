"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cases_1 = __importDefault(require("./cases"));
const lead_1 = __importDefault(require("./lead"));
const opportunity_1 = __importDefault(require("./opportunity"));
const customObject_1 = __importDefault(require("./customObject"));
const contact_1 = __importDefault(require("./contact"));
const account_1 = __importDefault(require("./account"));
const destination = {
    name: 'Salesforce (Actions)',
    slug: 'actions-salesforce',
    mode: 'cloud',
    authentication: {
        scheme: 'oauth2',
        fields: {
            instanceUrl: {
                label: 'Instance URL',
                description: 'The user specific instance URL returned by Salesforce Oauth. This setting is hidden to the user and set by Oauth Service.',
                type: 'string',
                required: true
            }
        },
        refreshAccessToken: async (request, { auth }) => {
            const res = await request('https://login.salesforce.com/services/oauth2/token', {
                method: 'POST',
                body: new URLSearchParams({
                    refresh_token: auth.refreshToken,
                    client_id: auth.clientId,
                    client_secret: auth.clientSecret,
                    grant_type: 'refresh_token'
                })
            });
            return { accessToken: res.data.access_token };
        }
    },
    extendRequest({ auth }) {
        return {
            headers: {
                authorization: `Bearer ${auth?.accessToken}`
            }
        };
    },
    actions: {
        lead: lead_1.default,
        customObject: customObject_1.default,
        cases: cases_1.default,
        contact: contact_1.default,
        opportunity: opportunity_1.default,
        account: account_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map