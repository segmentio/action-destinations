import type { ActionDefinition } from '@segment/actions-core'

export const BASE_URL = 'https://integrations.kameleoon.com/segmentio'

export const defaultPropertiesForEvents: ActionDefinition['fields'] = {
  event: {
    type: 'string',
    required: false,
    description: 'The event name',
    label: 'Event Name',
    default: {
      '@if': {
        exists: { '@path': '$.event' },
        then: { '@path': '$.event' },
        else: { '@path': '$.name' }
      }
    }
  },
  type: {
    label: 'Type',
    type: 'string',
    required: true,
    description: 'The type of the event',
    default: {
      '@path': '$.type'
    }
  },
  properties: {
    type: 'object',
    required: false,
    description: 'Additional event Properties or user Traits to send with the event',
    label: 'Event properties or user traits',
    default: {
      '@if': {
        exists: { '@path': '$.properties' },
        then: { '@path': '$.properties' },
        else: { '@path': '$.traits' }
      }
    }
  },
  kameleoonVisitorCode: {
    type: 'string',
    required: false,
    description: 'Kameleoon Visitor Code - a unique identifier for the user',
    label: 'Kameleoon Visitor Code',
    default: {
      '@if': {
        exists: { '@path': '$.properties.kameleoonVisitorCode' },
        then: { '@path': '$.properties.kameleoonVisitorCode' },
        else: { '@path': '$.traits.kameleoonVisitorCode' }
      }
    }
  }
}
