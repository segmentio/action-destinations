"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const sf_properties_1 = require("../sf-properties");
const sf_operations_1 = __importDefault(require("../sf-operations"));
const action = {
    title: 'Contact',
    description: 'Represents a contact, which is a person associated with an account.',
    fields: {
        operation: sf_properties_1.operation,
        traits: sf_properties_1.traits,
        last_name: {
            label: 'Last Name',
            description: "The contact's last name up to 80 characters. **This is required to create a contact.**",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.last_name' },
                    then: { '@path': '$.traits.last_name' },
                    else: { '@path': '$.properties.last_name' }
                }
            }
        },
        first_name: {
            label: 'First Name',
            description: "The contact's first name up to 40 characters.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.first_name' },
                    then: { '@path': '$.traits.first_name' },
                    else: { '@path': '$.properties.first_name' }
                }
            }
        },
        account_id: {
            label: 'Account ID',
            description: 'The ID of the account that this contact is associated with. This is the Salesforce-generated ID assigned to the account during creation (i.e. 0018c00002CDThnAAH).',
            type: 'string'
        },
        email: {
            label: 'Email',
            description: "The contact's email address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.email' },
                    then: { '@path': '$.traits.email' },
                    else: { '@path': '$.properties.email' }
                }
            }
        },
        mailing_city: {
            label: 'Mailing City',
            description: "City for the contact's mailing address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.address.city' },
                    then: { '@path': '$.traits.address.city' },
                    else: { '@path': '$.properties.address.city' }
                }
            }
        },
        mailing_postal_code: {
            label: 'Mailing Postal Code',
            description: "Postal Code for the contact's mailing address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.address.postal_code' },
                    then: { '@path': '$.traits.address.postal_code' },
                    else: { '@path': '$.properties.address.postal_code' }
                }
            }
        },
        mailing_country: {
            label: 'Mailing Country',
            description: "Country for the contact's mailing address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.address.country' },
                    then: { '@path': '$.traits.address.country' },
                    else: { '@path': '$.properties.address.country' }
                }
            }
        },
        mailing_street: {
            label: 'Mailing Street',
            description: "Street number and name for the contact's mailing address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.address.street' },
                    then: { '@path': '$.traits.address.street' },
                    else: { '@path': '$.properties.address.street' }
                }
            }
        },
        mailing_state: {
            label: 'Mailing State',
            description: "State for the contact's mailing address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.address.state' },
                    then: { '@path': '$.traits.address.state' },
                    else: { '@path': '$.properties.address.state' }
                }
            }
        },
        customFields: sf_properties_1.customFields
    },
    perform: async (request, { settings, payload }) => {
        const sf = new sf_operations_1.default(settings.instanceUrl, request);
        if (payload.operation === 'create') {
            if (!payload.last_name) {
                throw new actions_core_1.IntegrationError('Missing last_name value', 'Misconfigured required field', 400);
            }
            return await sf.createRecord(payload, 'Contact');
        }
        sf_properties_1.validateLookup(payload);
        if (payload.operation === 'update') {
            return await sf.updateRecord(payload, 'Contact');
        }
        if (payload.operation === 'upsert') {
            if (!payload.last_name) {
                throw new actions_core_1.IntegrationError('Missing last_name value', 'Misconfigured required field', 400);
            }
            return await sf.upsertRecord(payload, 'Contact');
        }
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map