"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const action = {
    title: 'Track Page View',
    description: 'Track a page view for a known or anonymous person.',
    defaultSubscription: 'type = "page"',
    fields: {
        id: {
            label: 'Person ID',
            description: 'The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).',
            type: 'string',
            default: {
                '@path': '$.userId'
            }
        },
        anonymous_id: {
            label: 'Anonymous ID',
            description: 'An anonymous ID for when no Person ID exists. [Learn more](https://customer.io/docs/anonymous-events/).',
            type: 'string',
            default: {
                '@path': '$.anonymousId'
            }
        },
        url: {
            label: 'Page URL',
            description: 'The URL of the page visited.',
            type: 'string',
            required: true,
            default: {
                '@path': '$.properties.url'
            }
        },
        timestamp: {
            label: 'Timestamp',
            description: 'A timestamp of when the event took place. Default is current date and time.',
            type: 'string',
            default: {
                '@path': '$.timestamp'
            }
        },
        data: {
            label: 'Event Attributes',
            description: 'Optional data to include with the event.',
            type: 'object',
            default: {
                '@path': '$.properties'
            }
        },
        convert_timestamp: {
            label: 'Convert Timestamps',
            description: 'Convert dates to Unix timestamps (seconds since Epoch).',
            type: 'boolean',
            default: true
        }
    },
    perform: (request, { settings, payload }) => {
        let timestamp = payload.timestamp;
        let data = payload.data;
        if (payload.convert_timestamp !== false) {
            if (timestamp) {
                timestamp = utils_1.convertValidTimestamp(timestamp);
            }
            if (data) {
                data = utils_1.convertAttributeTimestamps(data);
            }
        }
        const body = {
            name: payload.url,
            type: 'page',
            data,
            timestamp
        };
        let url;
        if (payload.id) {
            url = `${utils_1.trackApiEndpoint(settings.accountRegion)}/api/v1/customers/${payload.id}/events`;
        }
        else {
            url = `${utils_1.trackApiEndpoint(settings.accountRegion)}/api/v1/events`;
            body.anonymous_id = payload.anonymous_id;
        }
        return request(url, {
            method: 'post',
            json: body
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map