"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cordial_client_1 = __importDefault(require("../cordial-client"));
const user_identifier_1 = require("../user-identifier");
const common_fields_1 = require("../common-fields");
const action = {
    title: 'Upsert Contact',
    description: "Upsert Cordial Contact from Segment's identify events",
    defaultSubscription: 'type = "identify"',
    fields: {
        ...common_fields_1.commonFields,
        attributes: {
            label: 'Contact Attributes',
            description: 'Contact Attributes',
            type: 'object',
            required: false,
            default: {
                '@path': '$.traits'
            }
        }
    },
    perform: async (request, { settings, payload }) => {
        const client = new cordial_client_1.default(settings, request);
        const attributes = payload.attributes ? await client.transformAttributes(payload.attributes) : undefined;
        const userIdentifier = user_identifier_1.getUserIdentifier(payload.identifyByKey, payload.identifyByValue);
        return client.upsertContact(userIdentifier, attributes);
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map