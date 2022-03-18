"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const createUpdateContactAndLead_1 = __importDefault(require("./createUpdateContactAndLead"));
const destination = {
    name: 'Close',
    slug: 'close',
    mode: 'cloud',
    authentication: {
        scheme: 'basic',
        fields: {
            api_key: {
                label: 'API key',
                description: 'Your Close API key.',
                type: 'password',
                required: true
            },
            lead_custom_field_id_for_company_id: {
                label: 'Lead Custom Field ID for Company ID',
                description: "Enter the ID of a Lead Custom Field that'll be " +
                    "used to store Company ID. You'll need to create this Lead " +
                    'Custom Field in Close first, and then the integration will use ' +
                    'this field to store the Company ID when creating new contacts, ' +
                    'and/or will be used as a lookup key when updating existing ' +
                    'Lead. If this field is not filled out, it will only ' +
                    "lookup and de-dupe based on Contact's email.",
                type: 'string',
                default: '',
                required: false
            },
            contact_custom_field_id_for_user_id: {
                label: 'Contact Custom Field ID for User ID',
                description: "Enter the ID of a Contact Custom Field that'll be " +
                    "used to store User ID. You'll need to create this Contact " +
                    'Custom Field in Close first, and then the integration will use ' +
                    'this field to store the User ID when creating new contacts, ' +
                    'and/or will be used as a lookup key when updating existing ' +
                    'Contacts. If this field is not filled out, it will only ' +
                    'lookup and de-dupe based on email.',
                type: 'string',
                default: '',
                required: false
            }
        },
        testAuthentication: (request) => {
            return request(`https://api.close.com/api/v1/me/`);
        }
    },
    extendRequest({ settings }) {
        return {
            username: settings.api_key,
            password: ''
        };
    },
    actions: {
        createUpdateContactAndLead: createUpdateContactAndLead_1.default
    }
};
exports.default = destination;
//# sourceMappingURL=index.js.map