import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { BASE_URL } from '../consts'

/**
 * This action replaces sendData which is depracated
 * At the point of replacement - finaloop were still using the
 * old action and sending events to us
 */
const action: ActionDefinition<Settings, Payload> = {
  title: 'Track events',
  description: 'Send data to Blend AI for product usage insights',

  fields: {
    eventName: {
      label: 'Event Name',
      description: 'The name of event, page or screen',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.name' }
        }
      }
    },
    eventType: {
      label: 'Event Type',
      description: 'The type of event',
      type: 'string',
      default: { '@path': '$.type' }
    },
    eventProperties: {
      label: 'Event Properties',
      description: 'Properties of the event',
      type: 'object',
      default: { '@path': '$.properties' }
    },
    userTraits: {
      label: 'User Traits',
      description: 'User profile details / traits',
      type: 'object',
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.context.traits' }
        }
      }
    },
    identifiers: {
      label: 'Identifiers',
      description: 'User identifiers',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      properties: {
        anonymousId: {
          label: 'Anonymous ID',
          description: 'Segment anonymous ID',
          type: 'string'
        },
        userId: {
          label: 'User ID',
          description: 'User ID',
          type: 'string'
        }
      },
      default: {
        anonymousId: { '@path': '$.anonymousId' },
        userId: { '@path': '$.userId' }
      }
    }
  },
  defaultSubscription: 'type = "identify" or type = "page" or type = "screen" or type = "track"',
  perform: (request, { payload }) =>
    request(BASE_URL + 'segment', {
      method: 'POST',
      json: {
        type: payload.eventType,
        properties: payload.eventProperties,
        name: payload.eventName,
        userTraits: payload.userTraits,
        ...payload.identifiers
      }
    })
}

export default action
