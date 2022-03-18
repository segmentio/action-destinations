"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const trackEvent_1 = __importDefault(require("./trackEvent"));
const identifyUser_1 = __importDefault(require("./identifyUser"));
const regional_endpoints_1 = require("./regional-endpoints");
const destination = {
    name: 'Moengage (Actions)',
    slug: 'actions-moengage',
    mode: 'cloud',
    authentication: {
        scheme: 'custom',
        fields: {
            api_id: {
                label: 'Api Id',
                description: 'Your Moengage API Id',
                type: 'string',
                required: true
            },
            api_key: {
                label: 'Api Key',
                description: 'Your Moengage API Key',
                type: 'string',
                required: true
            },
            region: {
                label: 'Endpoint Region',
                description: 'The region to send your data.',
                type: 'string',
                format: 'text',
                required: true,
                choices: [
                    {
                        label: 'DataCenter-01',
                        value: 'DC_01'
                    },
                    {
                        label: 'DataCenter-02',
                        value: 'DC_02'
                    },
                    {
                        label: 'DataCenter-03',
                        value: 'DC_03'
                    }
                ],
                default: 'DC_01'
            }
        },
        testAuthentication: (request, { settings }) => {
            const endpoint = regional_endpoints_1.getEndpointByRegion(settings.region);
            return request(`${endpoint}/v1/integrations/segment/auth?appId=${settings.api_id}`, {
                method: 'get',
                headers: {
                    authorization: `Basic ${Buffer.from(`${settings.api_id}:${settings.api_key}`).toString('base64')}`
                }
            });
        }
    },
    actions: {
        trackEvent: trackEvent_1.default,
        identifyUser: identifyUser_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map