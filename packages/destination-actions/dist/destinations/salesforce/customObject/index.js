"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sf_properties_1 = require("../sf-properties");
const sf_operations_1 = __importDefault(require("../sf-operations"));
const action = {
    title: 'Custom Object',
    description: "Represents a custom object, which you create to store information that's specific to your company or industry, or a standard object.",
    fields: {
        operation: sf_properties_1.operation,
        traits: sf_properties_1.traits,
        customObjectName: {
            label: 'Salesforce Object',
            description: 'The API name of the Salesforce object that records will be added or updated within. This can be a standard or custom object. Custom objects must be predefined in your Salesforce account and should end with "__c".',
            type: 'string',
            required: true
        },
        customFields: { ...sf_properties_1.customFields, required: true }
    },
    perform: async (request, { settings, payload }) => {
        const sf = new sf_operations_1.default(settings.instanceUrl, request);
        if (payload.operation === 'create') {
            return await sf.createRecord(payload, payload.customObjectName);
        }
        sf_properties_1.validateLookup(payload);
        if (payload.operation === 'update') {
            return await sf.updateRecord(payload, payload.customObjectName);
        }
        if (payload.operation === 'upsert') {
            return await sf.upsertRecord(payload, payload.customObjectName);
        }
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map