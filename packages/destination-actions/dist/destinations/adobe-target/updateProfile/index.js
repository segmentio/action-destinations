"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adobeTarget_operations_1 = __importDefault(require("../adobeTarget_operations"));
const action = {
    title: 'Update Profile',
    description: 'Update an existing user profile in Adobe Target.',
    defaultSubscription: 'type = "identify"',
    fields: {
        user_id: {
            label: 'Mbox 3rd Party ID',
            description: "A user's unique visitor ID. This field is used to fetch a matching profile in Adobe Target to make an update on. For more information, please see our Adobe Target Destination documentation.",
            type: 'string',
            required: true,
            default: {
                '@if': {
                    exists: { '@path': '$.userId' },
                    then: { '@path': '$.userId' },
                    else: { '@path': '$.anonymousId' }
                }
            }
        },
        traits: {
            label: 'Profile Attributes',
            description: 'Profile parameters specific to a user. Please note, Adobe recommends that PII is hashed prior to sending to Adobe.',
            type: 'object',
            required: true,
            defaultObjectUI: 'keyvalue'
        }
    },
    perform: async (request, { settings, payload }) => {
        const at = new adobeTarget_operations_1.default(payload.user_id, settings.client_code, payload.traits, request);
        return await at.updateProfile();
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map