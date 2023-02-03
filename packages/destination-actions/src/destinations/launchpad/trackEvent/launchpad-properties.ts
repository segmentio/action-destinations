import { InputField } from '@segment/actions-core'

export const eventProperties: Record<string, InputField> = {
  anonymousId: {
    label: 'Anonymous ID',
    type: 'string',
    required: true,
    description: 'A distinct ID randomly generated prior to calling identify.',
    default: {
      '@path': '$.anonymousId'
    }
  },
  userId: {
    label: 'User ID',
    type: 'string',
    required: false,
    description: 'The distinct ID after calling identify.',
    default: {
      '@path': '$.userId'
    }
  },
  groupId: {
    label: 'Group ID',
    type: 'string',
    required: false,
    description: 'The unique identifier of the group that performed this event.',
    default: {
      '@path': '$.context.groupId'
    }
  },
  messageId: {
    label: 'Insert ID',
    type: 'string',
    required: true,
    description: 'A random id that is unique to an event. Launchpad uses $insert_id to deduplicate events.',
    default: {
      '@path': '$.messageId'
    }
  },
  timestamp: {
    label: 'Timestamp',
    type: 'datetime',
    required: true,
    description:
      'The timestamp of the event. Launchpad expects epoch timestamp in millisecond or second. Please note, Launchpad only accepts this field as the timestamp. If the field is empty, it will be set to the time Launchpad servers receive it.',
    default: {
      '@path': '$.timestamp'
    }
  },
  properties: {
    required: false,
    label: 'Event Properties',
    type: 'object',
    description: 'An object of key-value pairs that represent additional data to be sent along with the event.',
    default: {
      '@path': '$.properties'
    }
  },
  traits: {
    required: false,
    label: 'User Properties',
    type: 'object',
    description:
      'An object of key-value pairs that represent additional data tied to the user. This is used for segmentation within the platform.',
    default: {
      '@if': {
        exists: { '@path': '$.traits' },
        then: { '@path': '$.traits' },
        else: { '@path': '$.context.traits' }
      }
    }
  },
  context: {
    label: 'Event context',
    required: false,
    description: 'An object of key-value pairs that provides useful context about the event.',
    type: 'object',
    default: {
      '@path': '$.context'
    }
  },
  enable_batching: {
    required: false,
    type: 'boolean',
    label: 'Batch Data to Launchpad',
    description: 'Set as true to ensure Segment sends data to Launchpad in batches.',
    default: true
  }
}
