import type { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  type: {
    label: 'Event Type',
    description: 'The type of event to send to Appcues',
    type: 'string',
    required: true,
    choices: [
      { label: 'Track', value: 'track' },
      { label: 'Page', value: 'page' },
      { label: 'Screen', value: 'screen' },
      { label: 'Identify', value: 'identify' },
      { label: 'Group', value: 'group' }
    ],
    default: {
      '@path': '$.type'
    }
  },
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
    required: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'track'
        }
      ]
    },
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'track'
        }
      ]
    },
    default: {
      '@path': '$.event'
    }
  },
  name: {
    label: 'Name',
    description: 'The name of the page or screen',
    type: 'string',
    depends_on: {
      match: 'any',
      conditions: [
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'page'
        },
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'screen'
        }
      ]
    },
    default: {
      '@path': '$.name'
    }
  },
  properties: {
    label: 'Properties',
    description: 'Properties associated with the event',
    type: 'object',
    depends_on: {
      match: 'any',
      conditions: [
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'track'
        },
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'page'
        },
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'screen'
        }
      ]
    },
    default: {
      '@path': '$.properties'
    }
  },
  user_traits: {
    label: 'User Traits',
    description: 'Traits to identify the user with',
    type: 'object',
    depends_on: {
      match: 'any',
      conditions: [
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'track'
        },
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'page'
        },
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'screen'
        },
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'identify'
        }
      ]
    },
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
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'type',
          operator: 'is',
          value: 'group'
        }
      ]
    },
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
