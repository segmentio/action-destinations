"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sf_properties_1 = require("../sf-properties");
const sf_operations_1 = __importDefault(require("../sf-operations"));
const action = {
    title: 'Case',
    description: 'Represents a case, which is a customer issue or problem.',
    fields: {
        operation: sf_properties_1.operation,
        traits: sf_properties_1.traits,
        description: {
            label: 'Description',
            description: 'A text description of the case.',
            type: 'string'
        },
        customFields: sf_properties_1.customFields
    },
    perform: async (request, { settings, payload }) => {
        const sf = new sf_operations_1.default(settings.instanceUrl, request);
        if (payload.operation === 'create') {
            return await sf.createRecord(payload, 'Case');
        }
        sf_properties_1.validateLookup(payload);
        if (payload.operation === 'update') {
            return await sf.updateRecord(payload, 'Case');
        }
        if (payload.operation === 'upsert') {
            return await sf.upsertRecord(payload, 'Case');
        }
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map