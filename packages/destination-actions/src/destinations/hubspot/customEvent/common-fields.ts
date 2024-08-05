import { InputField } from '@segment/actions-core'
import { MAX_HUBSPOT_BATCH_SIZE } from './constants'

export const commonFields: Record<string, InputField> = {
  event_name: {
    label: 'Event Name',
    description: 'The name of the event to send to Hubspot.',
    type: 'string',
    required: true,
    dynamic: true
  },
  record_details: {
    label: 'Associated Record Details',
    description: 'Details of the record to associate the event with',
    type: 'object',
    required: true,
    defaultObjectUI: 'keyvalue:only',
    additionalProperties: false,
    properties: {
      object_type: {
        label: 'Object Type',
        description: 'The type of Hubspot Object to associate the event with.',
        type: 'string',
        required: true,
        dynamic: true
      },
      object_id_field_name: {
        label: 'Object ID Field Name',
        description: 'The name of the ID field for the record.',
        type: 'string',
        required: true,
        dynamic: true
      },
      record_id_value: {
        label: 'Record ID Value',
        description: 'The ID value for the record.',
        type: 'string',
        required: true
      }
    }
  },
  properties: {
    label: 'Properties',
    description: 'Properties to send with the event.',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue',
    dynamic: true,
    additionalProperties: true
  },
  occurred_at: {
    label: 'Event Timestamp',
    description: 'The time when this event occurred.',
    type: 'datetime',
    required: false,
    default: {
      '@path': '$.timestamp'
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
