"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const sf_properties_1 = require("../sf-properties");
const sf_operations_1 = __importDefault(require("../sf-operations"));
const action = {
    title: 'Lead',
    description: 'Represents a prospect or lead.',
    defaultSubscription: 'type = "identify"',
    fields: {
        operation: sf_properties_1.operation,
        traits: sf_properties_1.traits,
        company: {
            label: 'Company',
            description: "The lead's company. **This is required to create a lead.**",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.company' },
                    then: { '@path': '$.traits.company' },
                    else: { '@path': '$.properties.company' }
                }
            }
        },
        last_name: {
            label: 'Last Name',
            description: "The lead's last name. **This is required to create a lead.**",
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
            description: "The lead's first name.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.first_name' },
                    then: { '@path': '$.traits.first_name' },
                    else: { '@path': '$.properties.first_name' }
                }
            }
        },
        email: {
            label: 'Email',
            description: "The lead's email address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.email' },
                    then: { '@path': '$.traits.email' },
                    else: { '@path': '$.properties.email' }
                }
            }
        },
        city: {
            label: 'City',
            description: "City for the lead's address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.address.city' },
                    then: { '@path': '$.traits.address.city' },
                    else: { '@path': '$.properties.address.city' }
                }
            }
        },
        postal_code: {
            label: 'Postal Code',
            description: "Postal code for the lead's address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.address.postal_code' },
                    then: { '@path': '$.traits.address.postal_code' },
                    else: { '@path': '$.properties.address.postal_code' }
                }
            }
        },
        country: {
            label: 'Country',
            description: "Country for the lead's address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.address.country' },
                    then: { '@path': '$.traits.address.country' },
                    else: { '@path': '$.properties.address.country' }
                }
            }
        },
        street: {
            label: 'Street',
            description: "Street number and name for the lead's address.",
            type: 'string',
            default: {
                '@if': {
                    exists: { '@path': '$.traits.address.street' },
                    then: { '@path': '$.traits.address.street' },
                    else: { '@path': '$.properties.address.street' }
                }
            }
        },
        state: {
            label: 'State',
            description: "State for the lead's address.",
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
            if (!payload.company || !payload.last_name) {
                throw new actions_core_1.IntegrationError('Missing company or last_name value', 'Misconfigured required field', 400);
            }
            return await sf.createRecord(payload, 'Lead');
        }
        sf_properties_1.validateLookup(payload);
        if (payload.operation === 'update') {
            return await sf.updateRecord(payload, 'Lead');
        }
        if (payload.operation === 'upsert') {
            if (!payload.company || !payload.last_name) {
                throw new actions_core_1.IntegrationError('Missing company or last_name value', 'Misconfigured required field', 400);
            }
            return await sf.upsertRecord(payload, 'Lead');
        }
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map