import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export const fields: ActionDefinition<Settings, Payload>['fields'] = {
  userId: {
    label: 'User ID',
    description: 'The unique user identifier',
    type: 'string',
    default: {
      '@path': '$.userId'
    }
  },
  anonymousId: {
    label: 'Anonymous ID',
    description: 'The anonymous user identifier',
    type: 'string',
    default: {
      '@path': '$.anonymousId'
    }
  },
  event: {
    label: 'Event Name',
    description: 'The name of the event to track',
    type: 'string',
    default: {
      '@path': '$.event'
    }
  },
  properties: {
    label: 'Event Properties',
    description: 'Properties associated with the event',
    type: 'object',
    default: {
      '@path': '$.properties'
    }
  },
  user_traits: {
    label: 'User Traits',
    description: 'Traits to identify the user with',
    type: 'object',
    default: {
      '@if': {
        exists: { '@path': '$.context.traits' },
        then: { '@path': '$.context.traits' },
        else: { '@path': '$.traits' }
      }
    }
  },
  groupId: {
    label: 'Group ID',
    description: 'The unique group identifier',
    type: 'string',
    default: {
      '@path': '$.groupId'
    }
  },
  group_traits: {
    label: 'Group Traits',
    description: 'Traits associated with the group',
    type: 'object'
  },
  context: {
    label: 'Context',
    description: 'Context object containing additional event metadata',
    type: 'object',
    default: {
      '@path': '$.context'
    }
  },
  integrations: {
    label: 'Integrations',
    description: 'Integrations object to control which destinations receive this event',
    type: 'object',
    default: {
      '@path': '$.integrations'
    }
  },
  timestamp: {
    label: 'Timestamp',
    description: 'The timestamp of the event',
    type: 'string',
    default: {
      '@path': '$.timestamp'
    }
  },
  messageId: {
    label: 'Message ID',
    description: 'The unique message identifier',
    type: 'string',
    default: {
      '@path': '$.messageId'
    }
  }
}
