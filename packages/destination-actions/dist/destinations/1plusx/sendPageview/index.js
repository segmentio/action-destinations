"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mapValues_1 = __importDefault(require("lodash/mapValues"));
const action = {
    title: 'Send Pageview',
    description: 'Send a pageview to 1plusX',
    defaultSubscription: 'type = "page" or type = "screen"',
    fields: {
        ope_user_id: {
            label: 'User ID',
            description: "The user's unique identifier, prefixed with the identifier type",
            type: 'string',
            required: true,
            default: {
                '@template': 'ANONYMOUSID:{{anonymousId}}'
            }
        },
        ope_event_type: {
            label: 'Event Name',
            description: 'A description of the event',
            type: 'string',
            required: true,
            default: 'Pageview'
        },
        ope_alt_user_ids: {
            label: 'Alternative User IDs',
            description: 'Alternative user ids if there is more than one identifier available, each prefixed with the identifier type and separated by commas',
            type: 'string',
            multiple: true
        },
        ope_item_uri: {
            label: 'Website URL',
            description: 'The website URL of the page',
            type: 'string',
            default: {
                '@path': '$.context.page.url'
            }
        },
        ope_app_version: {
            label: 'Mobile App Version',
            description: 'Version of the mobile app',
            type: 'string',
            default: {
                '@path': '$.context.app.version'
            }
        },
        ope_event_time_ms: {
            label: 'Event Timestamp',
            description: 'Time of when the actual event happened. If not set, timestamp recorded by 1plusX upon receipt is used.',
            type: 'string',
            default: {
                '@path': '$.timestamp'
            }
        },
        ope_user_agent: {
            label: 'Browser UserAgent',
            description: 'The user agent as submitted by the browser',
            type: 'string',
            default: {
                '@path': '$.context.userAgent'
            }
        },
        gdpr: {
            label: 'GDPR Consent Flag',
            description: 'Set to 1 if subject to GDPR, set to 0 or leave blank if not subject to GDPR',
            type: 'integer'
        },
        gdpr_consent: {
            label: 'GDPR Consent String',
            description: 'If subject to GDPR, populate with appropriate consents',
            type: 'string'
        },
        ope_usp_string: {
            label: 'US Privacy Consent String',
            description: 'If subject to CCPA, this field should be populated with appropriate consents. 1plusX will parse the string value and process the event only when the consent indicates no optout from sales. Leave blank or set to 1--- if not subject to CCPA.',
            type: 'string'
        },
        platform: {
            label: 'Platform',
            description: 'The platform that data is originating from',
            type: 'string'
        },
        custom_fields: {
            label: 'Custom Fields',
            description: 'Custom fields to include with the event',
            type: 'object',
            default: {
                '@path': '$.properties'
            }
        }
    },
    perform: (request, { settings, payload }) => {
        const { custom_fields, ...cleanPayload } = payload;
        const cleanProps = mapValues_1.default(custom_fields, function (value) {
            if (typeof value === 'object')
                return;
            else if (typeof value === 'string')
                return value;
            else
                return JSON.stringify(value);
        });
        const endpoint = settings.use_test_endpoint
            ? `https://tagger-test.opecloud.com/${settings.client_id}/v2/native/event`
            : `https://tagger.opecloud.com/${settings.client_id}/v2/native/event`;
        return request(endpoint, {
            method: 'post',
            json: {
                ...cleanPayload,
                ...cleanProps
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map