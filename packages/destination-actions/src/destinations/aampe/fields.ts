import { InputField } from '@segment/actions-core'

export const contact_id: InputField = {
  label: 'Contact ID',
  description: 'Identifier for user. Use `userId` or `anonymousId` from the Segment event.',
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.userId' },
      then: { '@path': '$.userId' },
      else: { '@path': '$.anonymousId' }
    }
  },
  required: true
}

export const event_name: InputField = {
  label: 'Event Name',
  description: 'Name of the event. Use `event` from the Segment event.',
  type: 'string',
  default: {
    '@if': {
      exists: { '@path': '$.event' },
      then: { '@path': '$.event' },
      else: { '@path': '$.type' }
    }
  },
  required: true
}

export const timestamp: InputField = {
  label: 'Timestamp',
  description: 'Timestamp for when the event happened.',
  type: 'string',
  format: 'date-time',
  default: { '@path': '$.timestamp' },
  required: true
}

export const timezone: InputField = {
  label: 'Timezone',
  description: 'User’s local timezone.',
  type: 'string',
  default: { '@path': '$.context.timezone' }
}

export const metadata: InputField = {
  label: 'Metadata',
  description: 'Event properties.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  default: { '@path': '$.properties' }
}

export const event_id: InputField = {
  label: 'Event ID',
  description: 'Unique identifier for the event.',
  type: 'string',
  default: { '@path': '$.messageId' }
}

export const user_properties: InputField = {
  label: 'User Properties',
  description:
    'User properties. Make sure to update the default mapping if you are sending user proferties via properties object in a track, page or screen event.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  default: {
    '@if': {
      exists: { '@path': '$.traits' },
      then: { '@path': '$.traits' },
      else: { '@path': '$.context.traits' }
    }
  },
  required: true
}
