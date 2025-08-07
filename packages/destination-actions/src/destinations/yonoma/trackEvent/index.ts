import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { TrackEventJSON } from './types'
import { TRACK_EVENT_URL } from './constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Capture behavioral events for both known and anonymous users to build a complete activity timeline in Yonoma.',
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
          description: 'Anonymous identifier from Segment for tracking pre-identified activity.'
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
        email: { '@path': '$.traits.email' }
      }
    },
    listId: {
      label: 'List ID',
      type: 'string',
      description: "The Yonoma list to add the contact to.",
      required: true,
      default: { '@path': '$.traits.list_id' }
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
  perform: async (request, {payload}) => {
    const {
      event,
      listId,
      properties,
      identifiers: {
        userId,
        email,
        anonymousId
      } = {},
      timestamp
    } = payload

    if(!userId && !email && !anonymousId) {
      throw new PayloadValidationError('At least one identifier (userId, email, or anonymousId) is required.')
    }

    const json: TrackEventJSON = {
      event,
      ...(userId ? { userId } : {}),
      ...(anonymousId ? { anonymousId } : {}),
      ...(email ? { email } : {}),
      listId, 
      properties,
      timestamp
    }

    return await request(TRACK_EVENT_URL, {
      method: 'POST',
      json
    })
  
  }
}

export default action
