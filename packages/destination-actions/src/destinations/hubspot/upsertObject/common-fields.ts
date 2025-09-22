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
    label: 'Associations to add',
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
        description:
          'The Association label to apply between the two records. The Association label must already exist in Hubspot.',
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
  dissociations: {
    label: 'Associations to remove',
    description:
      'Remove Association Labels from an Association between two records. Removing the default association label will dissociate both records from each other completely.',
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
        description:
          'The Association label to remove between the two records. The Association label must already exist in Hubspot. Removing the default Association label will delete the entire Association between the two records.',
        type: 'string',
        required: true,
        dynamic: true,
        allowNull: false,
        disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
      },
      id_field_name: {
        label: 'To Object ID Field Name',
        description:
          'The name of the unique field Segment will use as an identifier when disassociating the record from another record. The unique field name must already exist on the Object in Hubspot.',
        type: 'string',
        required: true,
        dynamic: true,
        allowNull: false,
        disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
      },
      id_field_value: {
        label: 'To Object ID Field Value',
        description: 'The value of the identifier for the record to be disassociated with',
        type: 'string',
        required: false
      }
    }
  },
  list_details: {
    label: 'List Details',
    description: 'Details of the list to add or remove the record from',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue:only',
    additionalProperties: false,
    properties: {
      connected_to_engage_audience: {
        label: 'Connecting to Engage Audience',
        description: 'Set to true if syncing an Engage Audience to a Hubstpot list, false otherwise.',
        type: 'boolean',
        required: false,
        disabledInputMethods: ['literal', 'freeform']
      },
      list_name: {
        label: 'List Name',
        description:
          'The name of the Hubspot List to add or remove the record from. If connecting to an Engage Audience this field can be left empty.',
        type: 'string',
        required: false,
        allowNull: false,
        dynamic: true
      },
      list_action: {
        label: 'List Action',
        description: `Specify if the record should be added or removed from the list. true = add to list, false = remove from list. If connecting an Engage Audience this field must be left empty.`,
        type: 'boolean',
        disabledInputMethods: ['literal', 'freeform'],
        required: {
          match: 'all',
          conditions: [
            {
              fieldKey: 'list_details.list_name',
              operator: 'is_not',
              value: [null, '']
            },
            {
              fieldKey: 'list_details.connected_to_engage_audience',
              operator: 'is',
              value: false
            }
          ]
        },
        depends_on: {
          conditions: [
            {
              fieldKey: 'list_details.connected_to_engage_audience',
              operator: 'is',
              value: false
            }
          ]
        },
        allowNull: false
      },
      should_create_list: {
        label: 'Create List',
        description: 'If true, Segment will create the list in Hubspot if it does not already exist.',
        type: 'boolean',
        required: false,
        disabledInputMethods: ['literal', 'freeform']
      }
    },
    default: {
      connected_to_engage_audience: false,
      should_create_list: true
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
  },
  batch_keys: {
    label: 'Batch Keys',
    description: 'The keys to use for batching the events.',
    type: 'string',
    unsafe_hidden: true,
    required: false,
    multiple: true,
    default: ['list_details']
  },
  timestamp: {
    label: 'Timestamp',
    description:
      'The time the event occurred. This will be used to de-duplicate the events before sending them to hubspot.',
    type: 'string',
    required: false,
    default: { '@path': '$.timestamp' },
    disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
  },
  traits_or_props: {
    label: 'traits or properties object',
    description: 'Hidden field: Object which to get the traits or properties object from Engage Audience payloads.',
    type: 'object',
    required: false,
    unsafe_hidden: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties' },
        then: { '@path': '$.properties' },
        else: { '@path': '$.traits' }
      }
    }
  },
  computation_key: {
    label: 'Engage Audience Computation Key',
    description:
      'Hidden field: Engage Audience Computation Key refers to the audience slug name in an Engage Audience payload.',
    required: false,
    unsafe_hidden: true,
    type: 'string',
    default: {
      '@path': '$.context.personas.computation_key'
    }
  },
  computation_class: {
    label: 'Engage Audience Computation Class',
    description:
      'Hidden field: Engage Audience Computation Class indicates if the payload is from an Engage Audience or not.',
    type: 'string',
    required: false,
    unsafe_hidden: true,
    default: {
      '@path': '$.context.personas.computation_class'
    }
  }
}
