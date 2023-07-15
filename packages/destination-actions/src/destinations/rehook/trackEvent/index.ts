import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send the Track, Page or Screen event to rehook.',
  defaultSubscription: 'type = "track" or type = "page" or type = "screen"',
  fields: {
    event_name: {
      label: 'Event Name',
      type: 'string',
      required: true,
      description: 'The name of the event being performed.',
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.type' }
        }
      }
    },
    source_id: {
      label: 'Source ID',
      type: 'string',
      required: true,
      description: 'The unique user identifier set by you',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    metadata: {
      label: 'Event Properties',
      type: 'object',
      required: true,
      description: 'An object of key-value pairs that represent event properties to be sent along with the event.',
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.context' }
        }
      }
    }
  },
  perform: async (request, { payload }) => {
    return request('https://api.rehook.ai/events/invoke', {
      method: 'post',
      json: payload
    })
  }
}

export default action
