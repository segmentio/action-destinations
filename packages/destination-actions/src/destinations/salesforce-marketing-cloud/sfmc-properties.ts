import { ActionHookDefinition } from '@segment/actions-core/destination-kit'
import { InputField, FieldTypeName, DependsOnConditions } from '@segment/actions-core/destination-kit/types'
import { getCategories, getDataExtensions, selectOrCreateDataExtension } from './sfmc-operations'

export const contactKey: InputField = {
  label: 'Contact Key',
  description:
    'The unique identifier that you assign to a contact. This will be used to create a contact if one does not already exist with this Contact Key.',
  type: 'string',
  default: { '@path': '$.userId' }
}

export const contactKeyAPIEvent: InputField = {
  label: 'Contact Key',
  description: 'The unique identifier that identifies a subscriber or a contact.',
  type: 'string',
  default: { '@path': '$.userId' },
  required: true
}

export const key: InputField = {
  label: 'DEPRECATED: Data Extension Key',
  description:
    'Note: This field should be considered deprecated in favor of the hook input field "Data Extension ID". For backwards compatibility the field will not be deleted, and is instead hidden. The external key of the data extension that you want to store information in. The data extension must be predefined in SFMC. The external key is required if a Data Extension ID is not provided.',
  type: 'string',
  unsafe_hidden: true
}

export const id: InputField = {
  label: 'DEPRECATED: Data Extension ID',
  description:
    'Note: This field should be considered deprecated in favor of the hook input field "Data Extension ID". For backwards compatibility the field will not be deleted, and is instead hidden. The ID of the data extension that you want to store information in. The data extension must be predefined in SFMC. The ID is required if a Data Extension Key is not provided.',
  type: 'string',
  unsafe_hidden: true
}

export const keys: InputField = {
  label: 'Data Extension Primary Keys',
  description:
    'The primary key(s) that uniquely identify a row in the data extension. On the left-hand side, input the SFMC key name. On the right-hand side, map the Segment field that contains the corresponding value. When multiple primary keys are provided, SFMC will update an existing row if all primary keys match, otherwise a new row will be created',
  type: 'object',
  required: true,
  defaultObjectUI: 'keyvalue:only',
  additionalProperties: true,
  dynamic: true
}

export const values_contactFields: InputField = {
  label: 'Contact Fields',
  description:
    'The fields in the data extension that contain data about a contact, such as Email, Last Name, etc. Fields must be created in the data extension before sending data for it. On the left-hand side, input the SFMC field name exactly how it appears in the data extension. On the right-hand side, map the Segment field that contains the corresponding value.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only',
  required: true,
  dynamic: true
}

export const values_dataExtensionFields: InputField = {
  label: 'Data Extension Fields',
  description:
    'The fields in the data extension that contain data about an event, such as Product Name, Revenue, Event Time, etc. Fields must be created in the data extension before sending data for it. On the left-hand side, input the SFMC field name exactly how it appears in the data extension. On the right-hand side, map the Segment field that contains the corresponding value.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only',
  required: true,
  dynamic: true
}

export const eventDefinitionKey: InputField = {
  label: 'Event Definition Key',
  description:
    'The unique key for an event definition in Salesforce Marketing Cloud. The event defintion must be predefined in SFMC. ',
  type: 'string',
  required: true
}

export const eventData: InputField = {
  label: 'Event Data',
  description:
    'The properties of the event. Fields must be created in the event definition schema before sending data for it. On the left-hand side, input the SFMC field name exactly how it appears in the event definition schema. On the right-hand side, map the Segment field that contains the corresponding value.',
  type: 'object',
  defaultObjectUI: 'keyvalue:only'
}

export const enable_batching: InputField = {
  label: 'Batch data to SFMC',
  description: 'If true, data is batched before sending to the SFMC Data Extension.',
  type: 'boolean',
  default: false
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
  type: 'number',
  required: false,
  unsafe_hidden: true,
  /**
   * SFMC has very low limits on maximum batch size.
   * See: https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/postDataExtensionRowsetByKey.html
   * And: inc-sev3-6609-sfmc-timeouts-in-bulk-batching-2023-10-23
   *  */
  default: 10
}

// Scripting for the create/select existing data extension flow
const CREATE_OPERATION: DependsOnConditions = {
  match: 'all',
  conditions: [{ fieldKey: 'operation', operator: 'is', value: 'create' }]
}

const SELECT_OPERATION: DependsOnConditions = {
  match: 'all',
  conditions: [{ fieldKey: 'operation', operator: 'is', value: 'select' }]
}

export const dataExtensionHook: ActionHookDefinition<any, any, any, any, any> = {
  label: 'Create or Select Data Extension',
  description: 'Connect to an existing data extension or create a new one in Salesforce Marketing Cloud.',
  inputFields: {
    operation: {
      label: 'Operation',
      description: 'Whether to create a new data extension or select an existing one for data delivery.',
      type: 'string',
      choices: [
        { label: 'Create a new Data Extension', value: 'create' },
        { label: 'Select an existing Data Extension', value: 'select' }
      ],
      required: true
    },
    dataExtensionId: {
      label: 'Data Extension ID',
      description: 'The identifier for the data extension.',
      type: 'string',
      depends_on: SELECT_OPERATION,
      dynamic: async (request, { dynamicFieldContext, settings }) => {
        const query = dynamicFieldContext?.query
        return await getDataExtensions(request, settings.subdomain, settings, query)
      }
    },
    categoryId: {
      label: 'Category ID (Folder ID)',
      description: 'The identifier for the folder that contains the data extension.',
      type: 'string',
      required: CREATE_OPERATION,
      depends_on: CREATE_OPERATION,
      dynamic: async (request, { settings }) => {
        return await getCategories(request, settings)
      }
    },
    name: {
      label: 'Data Extension Name',
      description: 'The name of the data extension.',
      type: 'string',
      required: CREATE_OPERATION,
      depends_on: CREATE_OPERATION
    },
    description: {
      label: 'Data Extension Description',
      description: 'The description of the data extension.',
      type: 'string',
      depends_on: CREATE_OPERATION
    },
    columns: {
      label: 'Data Extension Fields',
      description: 'A list of fields to create in the data extension.',
      type: 'object' as FieldTypeName,
      multiple: true,
      defaultObjectUI: 'arrayeditor',
      additionalProperties: true,
      required: CREATE_OPERATION,
      depends_on: CREATE_OPERATION,
      properties: {
        name: {
          label: 'Field Name',
          description: 'The name of the field.',
          type: 'string',
          required: true
        },
        type: {
          label: 'Field Type',
          description: 'The data type of the field.',
          type: 'string',
          required: true,
          choices: ['Text', 'Number', 'Date', 'Boolean', 'EmailAddress', 'Phone', 'Decimal', 'Locale']
        },
        isNullable: {
          label: 'Is Nullable',
          description: 'Whether the field can be null.',
          type: 'boolean',
          required: true
        },
        isPrimaryKey: {
          label: 'Is Primary Key',
          description: 'Whether the field is a primary key.',
          type: 'boolean',
          required: true
        },
        length: {
          label: 'Field Length',
          description: 'The length of the field. Required for non-boolean fields',
          type: 'integer'
        },
        scale: {
          label: 'Decimal Scale',
          description: 'The scale of the field. Required for Decimal fields',
          type: 'integer'
        },
        description: {
          label: 'Field Description',
          description: 'The description of the field.',
          type: 'string'
        }
      }
    }
  },
  performHook: async (request, { settings, hookInputs }) => {
    return await selectOrCreateDataExtension(request, settings.subdomain, hookInputs, settings)
  },
  outputTypes: {
    id: {
      label: 'Data Extension ID',
      description: 'The identifier for the data extension.',
      type: 'string',
      required: true
    },
    name: {
      label: 'Data Extension Name',
      description: 'The name of the data extension.',
      type: 'string',
      required: true
    }
  }
}
