"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cordial_client_1 = __importDefault(require("../cordial-client"));
const common_fields_1 = require("../common-fields");
const action = {
    title: 'Create Contactactivity',
    description: "Create Cordial Contactactivity from Segment's track and page events",
    defaultSubscription: 'type = "track" or type = "page"',
    fields: {
        ...common_fields_1.commonFields,
        action: {
            label: 'Event name',
            description: 'Segment event name',
            type: 'string',
            required: true,
            default: {
                '@path': '$.event'
            }
        },
        time: {
            label: 'Event sentAt',
            description: 'Segment event sentAt',
            type: 'datetime',
            default: {
                '@path': '$.sentAt'
            }
        },
        properties: {
            label: 'Event properties',
            description: 'Segment event properties',
            type: 'object',
            default: {
                '@path': '$.properties'
            }
        }
    },
    perform: (request, { settings, payload }) => {
        const client = new cordial_client_1.default(settings, request);
        return client.addContactActivity(payload);
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map