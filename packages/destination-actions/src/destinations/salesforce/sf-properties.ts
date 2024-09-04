import { IntegrationError, InputField } from '@segment/actions-core'
import { DependsOnConditions } from '@segment/actions-core/destination-kit/types'

export const hideIfDeleteOperation: DependsOnConditions = {
  conditions: [
    {
      fieldKey: 'operation',
      operator: 'is_not',
      value: 'delete'
    }
  ]
}

export const operation: InputField = {
  label: 'Operation',
  description:
    'The Salesforce operation performed. The available operations are Create, Delete, Update or Upsert records in Salesforce.',
  type: 'string',
  required: true,
  choices: [
    { label: 'Create new record', value: 'create' },
    { label: 'Update existing record', value: 'update' },
    { label: `Update or create a record if one doesn't exist`, value: 'upsert' },
    { label: 'Delete existing record', value: 'delete' }
  ]
}

export const enable_batching: InputField = {
  label: 'Use Salesforce Bulk API',
  description:
    'If true, events are sent to [Salesforce’s Bulk API 2.0](https://developer.salesforce.com/docs/atlas.en-us.api_asynch.meta/api_asynch/asynch_api_intro.htm) rather than their streaming REST API. Once enabled, Segment will collect events into batches of 5000 before sending to Salesforce.',
  type: 'boolean',
  default: false,
  depends_on: hideIfDeleteOperation
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  required: false,
  unsafe_hidden: true,
  default: 5000,
  depends_on: hideIfDeleteOperation
}

export const bulkUpsertExternalId: InputField = {
  label: 'Bulk Upsert External Id',
  description: 'The external id field name and mapping to use for bulk upsert.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only',
  additionalProperties: false,
  properties: {
    externalIdName: {
      label: 'External Id Name',
      description: 'The external id field name as defined in Salesforce.',
      type: 'string'
    },
    externalIdValue: {
      label: 'External Id Value',
      description: 'The external id field value to use for bulk upsert.',
      type: 'string'
    }
  },
  depends_on: {
    match: 'all',
    conditions: [
      {
        fieldKey: 'operation',
        operator: 'is',
        value: 'upsert'
      },
      {
        fieldKey: 'enable_batching',
        operator: 'is',
        value: true
      }
    ]
  }
}

export const bulkUpdateRecordId: InputField = {
  label: 'Bulk Update Record Id',
  description: 'The record id value to use for bulk update.',
  type: 'string',
  depends_on: {
    match: 'all',
    conditions: [
      {
        fieldKey: 'operation',
        operator: 'is',
        value: 'update'
      },
      {
        fieldKey: 'enable_batching',
        operator: 'is',
        value: true
      }
    ]
  }
}

// Any actions configured before this field was added will have an undefined value for this field.
// We default to the 'OR' when consuming this field if it is undefined.
export const recordMatcherOperator: InputField = {
  label: 'Record Matchers Operator',
  description:
    'This field affects how Segment uses the record matchers to query Salesforce records. By default, Segment uses the "OR" operator to query Salesforce for a record. If you would like to query Salesforce records using a combination of multiple record matchers, change this to "AND".',
  type: 'string',
  choices: [
    { label: 'OR', value: 'OR' },
    { label: 'AND', value: 'AND' }
  ],
  default: 'OR',
  depends_on: {
    conditions: [
      {
        fieldKey: 'operation',
        operator: 'is',
        value: ['update', 'upsert', 'delete']
      }
    ]
  }
}

export const traits: InputField = {
  label: 'Record Matchers',
  description: `The fields used to find Salesforce records for updates. **This is required if the operation is Delete, Update or Upsert.**

  Any field can function as a matcher, including Record ID, External IDs, standard fields and custom fields. On the left-hand side, input the Salesforce field API name. On the right-hand side, map the Segment field that contains the value.  
  
  If multiple records are found, no changes will be made. **Please use fields that result in unique records.**
  
  ---

  `,
  type: 'object',
  defaultObjectUI: 'keyvalue:only',
  depends_on: {
    conditions: [
      {
        fieldKey: 'operation',
        operator: 'is',
        value: ['update', 'upsert', 'delete']
      }
    ]
  }
}

export const customFields: InputField = {
  label: 'Other Fields',
  description: `
  Additional fields to send to Salesforce. On the left-hand side, input the Salesforce field API name. On the right-hand side, map the Segment field that contains the value.

  This can include standard or custom fields. Custom fields must be predefined in your Salesforce account and the API field name should have __c appended.
  
  ---
  
  `,
  type: 'object',
  defaultObjectUI: 'keyvalue',
  depends_on: hideIfDeleteOperation
}

interface Payload {
  operation?: string
  traits?: object
}

export const validateLookup = (payload: Payload) => {
  if (payload.operation === 'update' || payload.operation === 'upsert' || payload.operation === 'delete') {
    if (!payload.traits) {
      throw new IntegrationError(
        'Undefined lookup traits for update or upsert operation',
        'Misconfigured Required Field',
        400
      )
    }
  }
}
