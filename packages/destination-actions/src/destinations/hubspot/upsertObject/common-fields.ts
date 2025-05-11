import { InputField } from '@segment/actions-core'
import { MAX_HUBSPOT_BATCH_SIZE } from './constants'

export const commonFields: Record<string, InputField> = {
  object_details: {
    label: 'Object Details',
    description: 'Details of the object to associate the record with',
    type: 'object',
    required: true,
    defaultObjectUI: 'keyvalue:only',
    additionalProperties: false,
    properties: {
      object_type: {
        label: 'Object Type',
        description: 'The type of Hubspot Object to add/update a record for.',
        type: 'string',
        required: true,
        allowNull: false,
        dynamic: true,
        disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
      },
      id_field_name: {
        label: 'Object ID Field Name',
        description: 'The name of the ID field for the record.',
        type: 'string',
        required: true,
        allowNull: false,
        dynamic: true,
        disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
      },
      id_field_value: {
        label: 'Object ID Field Value',
        description: 'The ID value for the record.',
        type: 'string',
        required: true,
        allowNull: false
      },
      property_group: {
        label: 'Property Group',
        description:
          'Segment can new create properties on the object if needed. To enable this select the property group for Segment to add new properties to. To disable leave this field blank.',
        type: 'string',
        required: false,
        default: undefined,
        dynamic: true,
        disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
      }
    }
  },
  properties: {
    label: 'Properties',
    description: 'Properties to set on the record.',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue',
    dynamic: true,
    additionalProperties: true
  },
  sensitive_properties: {
    label: 'Sensitive Properties',
    description: 'Sensitive Properties to set on the record.',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue',
    dynamic: true,
    additionalProperties: true
  },
  association_sync_mode: {
    label: 'Associated Record Sync Mode',
    description:
      'Specify if Segment create associated records in Hubspot. Records will only be created if the record requires a single identifier field and does not require property fields to be set upon creation.',
    type: 'string',
    default: 'upsert',
    required: true,
    choices: [
      { label: 'Create', value: 'upsert' },
      { label: 'Do not create', value: 'read' }
    ],
    disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
  },
  associations: {
    label: 'Associations',
    description: 'Associations to create between the record and other records.',
    type: 'object',
    multiple: true,
    required: false,
    defaultObjectUI: 'arrayeditor',
    additionalProperties: false,
    properties: {
      object_type: {
        label: 'To Object Type',
        description: 'The type of associated Hubspot Object.',
        type: 'string',
        required: true,
        dynamic: true,
        allowNull: false,
        disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
      },
      association_label: {
        label: 'Association Label',
        description: 'The type of Association between the two records. The Association must already exist in Hubspot.',
        type: 'string',
        required: true,
        dynamic: true,
        allowNull: false,
        disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
      },
      id_field_name: {
        label: 'To Object ID Field Name',
        description:
          'The name of the unique field Segment will use as an identifier when associating the record to another record. The unique field name must already exist on the Object in Hubspot.',
        type: 'string',
        required: true,
        dynamic: true,
        allowNull: false,
        disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
      },
      id_field_value: {
        label: 'To Object ID Field Value',
        description: 'The value of the identifier for the record to be associated with',
        type: 'string',
        required: false
      }
    }
  },
  enable_batching: {
    type: 'boolean',
    label: 'Batch Data to Hubspot by default',
    description: 'By default Segment batches events to Hubspot.',
    default: true,
    unsafe_hidden: true
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch.',
    type: 'number',
    required: true,
    unsafe_hidden: true,
    default: MAX_HUBSPOT_BATCH_SIZE
  }
}
