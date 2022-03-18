"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const action = {
    title: 'Create or Update Device',
    description: `Track an "Application Installed" or "Application Opened" event to create or update a person's device.`,
    defaultSubscription: 'type = "track" and event = "Application Installed"',
    fields: {
        person_id: {
            label: 'Person ID',
            description: 'The ID of the person that this mobile device belongs to.',
            type: 'string',
            required: true,
            default: {
                '@path': '$.userId'
            }
        },
        device_id: {
            label: 'Device ID',
            description: "The device token of a customer's mobile device.",
            type: 'string',
            required: true,
            default: {
                '@path': '$.context.device.token'
            }
        },
        platform: {
            label: 'Platform',
            description: `The mobile device's platform. ("ios" or "android")`,
            type: 'string',
            required: true,
            default: {
                '@path': '$.context.device.type'
            }
        },
        last_used: {
            label: 'Last Used',
            description: 'The timestamp for when the mobile device was last used. Default is current date and time.',
            type: 'string',
            default: {
                '@path': '$.timestamp'
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
        let lastUsed = payload.last_used;
        if (lastUsed && payload.convert_timestamp !== false) {
            lastUsed = utils_1.convertValidTimestamp(lastUsed);
        }
        return request(`${utils_1.trackApiEndpoint(settings.accountRegion)}/api/v1/customers/${payload.person_id}/devices`, {
            method: 'put',
            json: {
                device: {
                    id: payload.device_id,
                    platform: payload.platform,
                    last_used: lastUsed
                }
            }
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map