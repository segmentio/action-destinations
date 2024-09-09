import { InputField } from '@segment/actions-core'
import { DEPENDS_ON_OBJECT_TYPE_CONTACT } from './constants'

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
        dynamic: true,
        allowNull: false,
        disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
      },
      object_id: {
        label: 'Object ID',
        description:
          'The numeric Object ID of the object to associate the event with. For example a contact id or a visitor id value. Works for Contacts, Companies, Deals, Tickets and Custom Objects.',
        type: 'number',
        required: false
      },
      email: {
        label: 'Email Address',
        description:
          'The email address of the Contact to associate the event with. This field only works for Contact objects.',
        type: 'string',
        required: false,
        format: 'email',
        default: {
          '@if': {
            exists: { '@path': '$.properties.email' },
            then: { '@path': '$.properties.email' },
            else: { '@path': '$.context.traits.email' }
          }
        },
        depends_on: DEPENDS_ON_OBJECT_TYPE_CONTACT
      },
      utk: {
        label: 'User Token / UTK',
        description: 'The user token of the Contact to associate the event with.',
        type: 'string',
        required: false,
        depends_on: DEPENDS_ON_OBJECT_TYPE_CONTACT
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
  }
}
