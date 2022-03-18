"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_core_1 = require("@segment/actions-core");
const sf_operations_1 = __importDefault(require("../sf-operations"));
const sf_properties_1 = require("../sf-properties");
const action = {
    title: 'Opportunity',
    description: 'Represents an opportunity, which is a sale or pending deal.',
    fields: {
        operation: sf_properties_1.operation,
        traits: sf_properties_1.traits,
        close_date: {
            label: 'Close Date',
            description: 'Date when the opportunity is expected to close. Use yyyy-MM-dd format. **This is required to create an opportunity.**',
            type: 'string'
        },
        name: {
            label: 'Name',
            description: 'A name for the opportunity. **This is required to create an opportunity.**',
            type: 'string'
        },
        stage_name: {
            label: 'Stage Name',
            description: 'Current stage of the opportunity. **This is required to create an opportunity.**',
            type: 'string'
        },
        amount: {
            label: 'Amount',
            description: 'Estimated total sale amount.',
            type: 'string'
        },
        description: {
            label: 'Description',
            description: 'A text description of the opportunity.',
            type: 'string'
        },
        customFields: sf_properties_1.customFields
    },
    perform: async (request, { settings, payload }) => {
        const sf = new sf_operations_1.default(settings.instanceUrl, request);
        if (payload.operation === 'create') {
            if (!payload.close_date || !payload.name || !payload.stage_name) {
                throw new actions_core_1.IntegrationError('Missing close_date, name or stage_name value', 'Misconfigured required field', 400);
            }
            return await sf.createRecord(payload, 'Opportunity');
        }
        sf_properties_1.validateLookup(payload);
        if (payload.operation === 'update') {
            return await sf.updateRecord(payload, 'Opportunity');
        }
        if (payload.operation === 'upsert') {
            if (!payload.close_date || !payload.name || !payload.stage_name) {
                throw new actions_core_1.IntegrationError('Missing close_date, name or stage_name value', 'Misconfigured required field', 400);
            }
            return await sf.upsertRecord(payload, 'Opportunity');
        }
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map