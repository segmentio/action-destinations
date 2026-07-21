import type { ActionDefinition } from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'
import { sendRequest } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify a user in Trubrics and associate traits with them.',
  fields: {
    user_id: {
      label: 'User ID',
      type: 'string',
      description: 'The ID of the user performing the event.',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      type: 'string',
      description: 'An anonymous identifier',
      required: false,
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    traits: {
      label: 'Traits',
      type: 'object',
      description: 'The traits of the user.',
      required: false,
      default: {
        '@path': '$.traits'
      }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: false,
      description: 'The timestamp of the event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    }
  },
  perform: async (request, { settings, payload }) => await sendRequest(request, settings, [payload]),
  performBatch: async (request, { settings, payload }) => await sendRequest(request, settings, payload)
}

export default action
