import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SendEventJSON } from './types'
import { SEND_EVENT_URL } from './constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Trigger automation based on a contact’s action within your product',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the event to track.',
      required: true,
      default: { '@path': '$.event' }
    },
    identifiers: {
      label: 'Identifiers',
      type: 'object',
      description: 'Unique identifiers for the contact. At least one of userId or anonymousId is required.',
      required: true,
      additionalProperties: false,
      properties: {
        userId: {
          label: 'User ID',
          type: 'string',
          description: 'Unique user identifier from your app.'
        },
        anonymousId: {
          label: 'Anonymous ID',
          type: 'string',
          description: 'Anonymous identifier from Segment.',
          readOnly: false
        },
        email: {
          label: 'Email',
          type: 'string',
          description: "Contact's email address. Required if userId is not provided."
        }
      },
      default: {
        userId: { '@path': '$.userId' },
        anonymousId: { '@path': '$.anonymousId' },
        email: {
          '@if': {
            exists: { '@path': '$.context.traits.email' },
            then: { '@path': '$.context.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        }
      }
    },
    listId: {
      label: 'List ID',
      type: 'string',
      description: 'The Yonoma list to add the contact to.',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.list_id' },
          then: { '@path': '$.context.traits.list_id' },
          else: { '@path': '$.properties.list_id' }
        }
      }
    },
    properties: {
      label: 'Event Properties',
      type: 'object',
      description: 'Additional properties associated with the event.',
      required: false,
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.properties' }
    },
    timestamp: {
      label: 'Timestamp',
      type: 'string',
      description: 'The timestamp of the event. Defaults to the current time if not provided.',
      format: 'date-time',
      default: { '@path': '$.timestamp' }
    }
  },
  perform: async (request, { payload }) => {
    const { event, properties, identifiers: { userId, email } = {}, listId, timestamp } = payload

    if (!userId && !email) {
      throw new PayloadValidationError('At least one identifier (userId or email) is required.')
    }

    delete properties?.email
    delete properties?.list_id

    const json: SendEventJSON = {
      event,
      userId,
      listId,
      properties,
      timestamp
    }

    return await request(SEND_EVENT_URL, {
      method: 'POST',
      json
    })
  }
}

export default action
