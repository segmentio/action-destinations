import { InputField } from '@segment/actions-core'

export const eventProperties: Record<string, InputField> = {
  anonymousId: {
    label: 'Anonymous ID',
    type: 'string',
    description: 'A distinct ID randomly generated prior to calling identify.',
    default: {
      '@path': '$.anonymousId'
    }
  },
  userId: {
    label: 'User ID',
    type: 'string',
    description: 'The distinct ID after calling identify.',
    default: {
      '@path': '$.userId'
    }
  },
  groupId: {
    label: 'Group ID',
    type: 'string',
    description: 'The unique identifier of the group that performed this event.',
    default: {
      '@path': '$.context.groupId'
    }
  },
  messageId: {
    label: 'Insert ID',
    type: 'string',
    description: 'A random id that is unique to an event. Launchpad uses $insert_id to deduplicate events.',
    default: {
      '@path': '$.messageId'
    }
  },
  timestamp: {
    label: 'Timestamp',
    type: 'datetime',
    required: false,
    description:
      'The timestamp of the event. Launchpad expects epoch timestamp in millisecond or second. Please note, Launchpad only accepts this field as the timestamp. If the field is empty, it will be set to the time Launchpad servers receive it.',
    default: {
      '@path': '$.timestamp'
    }
  },
  properties: {
    label: 'Event Properties',
    type: 'object',
    description: 'An object of key-value pairs that represent additional data to be sent along with the event.',
    default: {
      '@path': '$.properties'
    }
  },
  traits: {
    label: 'User Properties',
    type: 'object',
    description: 'An object of key-value pairs that represent additional data tied to the user.',
    default: {
      '@path': '$.traits'
    }
  },
  context: {
    label: 'Event context',
    description: 'An object of key-value pairs that provides useful context about the event.',
    type: 'object',
    default: {
      '@path': '$.context'
    }
  },
  enable_batching: {
    type: 'boolean',
    label: 'Batch Data to Launchpad',
    description: 'Set as true to ensure Segment sends data to Launchpad in batches.',
    default: true
  }
}
