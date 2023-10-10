import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

//const base = 'https://6550-2-139-22-73.ngrok-free.app/';
const base = 'https://eo493p73oqjeket.m.pipedream.net/'
const endpoint = base + 'public-api/integrations/segment/webhook'

const destination: DestinationDefinition<Settings> = {
  name: 'Trackey',
  slug: 'actions-trackey',
  mode: 'cloud',
  description: 'Send Segment events to Trackey',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Trackey API Key',
        type: 'string',
        required: true
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: {
        'api-key': settings.apiKey,
        'Content-Type': 'application/json'
      }
    }
  },
  onDelete: async () => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
    return true
  },
  actions: {
    track: {
      title: 'track',
      description: 'Track an event',
      defaultSubscription: 'type = "track"',
      fields: {
        userId: {
          label: 'User ID',
          type: 'string',
          required: true,
          description: 'The user identifier to associate the event with',
          default: { '@path': '$.userId' }
        },
        event: {
          label: 'Event Name',
          type: 'string',
          required: true,
          description: 'Name of the Segment track() event',
          default: { '@path': '$.event' }
        },
        messageId: {
          label: 'Message ID',
          type: 'string',
          description: 'A unique value for each event.',
          default: {
            '@path': '$.messageId'
          }
        },
        timestamp: {
          label: 'Event Timestamp',
          type: 'string',
          required: true,
          description: 'Timestamp that the event took place, in ISO 8601 format. e.g. 2019-06-12T19:11:01.152Z',
          default: { '@path': '$.timestamp' }
        },
        properties: {
          label: 'Event Properties',
          type: 'object',
          required: false,
          description: 'Additional information associated with the track() event',
          default: { '@path': '$.properties' }
        },
        groupId: {
          label: 'Group ID',
          type: 'object',
          required: false,
          description: 'Company ID associated with the event',
          default: { '@path': '$.context.group_id' }
        }
      },
      perform: (request, { payload }) => {
        return request(endpoint, {
          method: 'POST',
          json: {
            userId: payload.userId,
            event: payload.event,
            messageId: payload.messageId,
            timestamp: payload.timestamp,
            properties: payload.properties,
            groupId: payload.groupId
          }
        })
      }
    },
    identify: {
      title: 'Identify',
      description: 'Identify a user',
      defaultSubscription: 'type = "identify"',
      fields: {
        userId: {
          label: 'User ID',
          type: 'string',
          required: true,
          description: 'The user identifier to associate the event with',
          default: { '@path': '$.userId' }
        },
        messageId: {
          label: 'Message ID',
          type: 'string',
          description: 'A unique value for each event.',
          default: {
            '@path': '$.messageId'
          }
        },
        timestamp: {
          label: 'Event Timestamp',
          type: 'string',
          required: true,
          description: 'Timestamp that the event took place, in ISO 8601 format. e.g. 2019-06-12T19:11:01.152Z',
          default: { '@path': '$.timestamp' }
        },
        traits: {
          label: 'User Traits',
          type: 'object',
          required: false,
          description: 'User profile information',
          default: { '@path': '$.traits' }
        },
        groupId: {
          label: 'Group ID',
          type: 'object',
          required: false,
          description: 'Company ID associated with the event',
          default: { '@path': '$.context.group_id' }
        }
      },
      perform: (request, { payload }) => {
        return request(endpoint, {
          method: 'POST',
          json: {
            userId: payload.userId,
            messageId: payload.messageId,
            timestamp: payload.timestamp,
            traits: payload.traits,
            groupId: payload.groupId
          }
        })
      }
    },
    group: {
      title: 'Group',
      description: 'Group a user',
      defaultSubscription: 'type = "group"',
      fields: {
        userId: {
          label: 'User ID',
          type: 'string',
          required: true,
          description: 'The user identifier to associate the event with',
          default: { '@path': '$.userId' }
        },
        messageId: {
          label: 'Message ID',
          type: 'string',
          description: 'A unique value for each event.',
          default: {
            '@path': '$.messageId'
          }
        },
        timestamp: {
          label: 'Event Timestamp',
          type: 'string',
          required: true,
          description: 'Timestamp that the event took place, in ISO 8601 format. e.g. 2019-06-12T19:11:01.152Z',
          default: { '@path': '$.timestamp' }
        },
        traits: {
          label: 'COmpany Traits',
          type: 'object',
          required: false,
          description: 'Company profile information',
          default: { '@path': '$.traits' }
        },
        groupId: {
          label: 'Group ID',
          type: 'object',
          required: true,
          description: 'Company ID associated with the event',
          default: { '@path': '$.groupId' }
        }
      },
      perform: (request, { payload }) => {
        return request(endpoint, {
          method: 'POST',
          json: {
            userId: payload.userId,
            messageId: payload.messageId,
            timestamp: payload.timestamp,
            traits: payload.traits,
            groupId: payload.groupId
          }
        })
      }
    }
  }
}

export default destination
