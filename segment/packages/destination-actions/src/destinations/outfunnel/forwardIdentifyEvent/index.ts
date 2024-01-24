import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEndpoint } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward identify event',
  description: 'Forward identify event to Outfunnel',
  defaultSubscription: 'type = "identify"',
  fields: {
    action: {
      type: 'string',
      unsafe_hidden: true,
      required: true,
      description: 'Indicates which action was triggered',
      label: 'Action name',
      default: 'identify'
    },
    user_id: {
      type: 'string',
      unsafe_hidden: true,
      description: 'The identifier of the user',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      type: 'string',
      unsafe_hidden: true,
      description: 'Anonymous ID of the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    email: {
      type: 'string',
      required: true,
      description: 'Email address of the user who performed the event',
      label: 'Email Address',
      default: {
        '@path': '$.traits.email'
      }
    },
    timestamp: {
      type: 'string',
      unsafe_hidden: true,
      required: true,
      description: 'The time the event occured in UTC',
      label: 'Event timestamp',
      default: {
        '@path': '$.timestamp'
      }
    },
    traits: {
      type: 'object',
      description: 'Optional metadata describing the user',
      label: 'User traits',
      default: {
        '@path': '$.traits'
      }
    },
    context: {
      type: 'object',
      description: 'Event context',
      label: 'Event context',
      default: {
        '@path': '$.context'
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    const endpoint = getEndpoint(settings.userId)

    return request(endpoint, {
      method: 'POST',
      json: payload
    })
  }
}

export default action
