import type { InputField } from '@segment/actions-core'

// Event Name Field
export const eventName: InputField = {
  label: 'Event Name',
  description: 'The name of the behavioral event to send to HubSpot',
  type: 'string',
  required: true,
  default: { '@path': '$.event' }
}

// User Email Field
export const email: InputField = {
  label: 'User Email',
  description: 'Email address of the user who performed the event',
  type: 'string',
  format: 'email',
  required: true,
  default: {
    '@if': {
      exists: { '@path': '$.context.traits.email' },
      then: { '@path': '$.context.traits.email' },
      else: { '@path': '$.properties.email' }
    }
  }
}

// Event Timestamp Field
export const occurredAt: InputField = {
  label: 'Event Timestamp',
  description: 'When the event occurred (will be converted to Unix timestamp)',
  type: 'string',
  format: 'date-time',
  required: true,
  default: { '@path': '$.timestamp' }
}

// Event Properties Field
export const properties: InputField = {
  label: 'Event Properties',
  description: 'Additional properties to send with the behavioral event',
  type: 'object',
  required: false,
  additionalProperties: true,
  default: { '@path': '$.properties' }
}

// Object ID Field (optional)
export const objectId: InputField = {
  label: 'Object ID',
  description: 'Optional HubSpot object ID to associate this event with',
  type: 'string',
  required: false,
  default: { '@path': '$.userId' }
}

// Object Type Field (optional)
export const objectType: InputField = {
  label: 'Object Type',
  description: 'The type of HubSpot object to associate this event with',
  type: 'string',
  required: false,
  choices: [
    { label: 'Contact', value: 'contact' },
    { label: 'Company', value: 'company' },
    { label: 'Deal', value: 'deal' },
    { label: 'Ticket', value: 'ticket' }
  ],
  default: 'contact'
}