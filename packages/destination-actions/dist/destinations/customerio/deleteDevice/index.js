"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const action = {
    title: 'Delete Device',
    description: `Track an "Application Uninstalled" event to delete a person's device.`,
    defaultSubscription: 'event = "Application Uninstalled"',
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
        }
    },
    perform: (request, { settings, payload }) => {
        return request(`${utils_1.trackApiEndpoint(settings.accountRegion)}/api/v1/customers/${payload.person_id}/devices/${payload.device_id}`, {
            method: 'delete'
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map