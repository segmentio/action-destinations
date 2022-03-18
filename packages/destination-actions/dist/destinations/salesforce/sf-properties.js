"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLookup = exports.customFields = exports.traits = exports.operation = void 0;
const actions_core_1 = require("@segment/actions-core");
exports.operation = {
    label: 'Operation',
    description: 'The Salesforce operation performed. The available operations are Create, Update or Upsert records in Salesforce.',
    type: 'string',
    required: true,
    choices: [
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' },
        { label: 'Upsert', value: 'upsert' }
    ]
};
exports.traits = {
    label: 'Record Matchers',
    description: `The fields used to find Salesforce records for updates. **This is required if the operation is Update or Upsert.**

  Any field can function as a matcher, including Record ID, External IDs, standard fields and custom fields. On the left-hand side, input the Salesforce field API name. On the right-hand side, map the Segment field that contains the value.  
  
  If multiple records are found, no updates will be made. **Please use fields that result in unique records.**
  
  ---

  `,
    type: 'object',
    defaultObjectUI: 'keyvalue:only'
};
exports.customFields = {
    label: 'Other Fields',
    description: `
  Additional fields to send to Salesforce. On the left-hand side, input the Salesforce field API name. On the right-hand side, map the Segment field that contains the value.

  This can include standard or custom fields. Custom fields must be predefined in your Salesforce account and the API field name should have __c appended.
  
  ---
  
  `,
    type: 'object',
    defaultObjectUI: 'keyvalue'
};
const validateLookup = (payload) => {
    if (payload.operation === 'update' || payload.operation === 'upsert') {
        if (!payload.traits) {
            throw new actions_core_1.IntegrationError('Undefined lookup traits for update or upsert operation', 'Misconfigured Required Field', 400);
        }
    }
};
exports.validateLookup = validateLookup;
//# sourceMappingURL=sf-properties.js.map