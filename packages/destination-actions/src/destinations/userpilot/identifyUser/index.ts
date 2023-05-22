import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { getIdentifyRequestParams } from '../request-utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description:
    'Defines a user in Userpilot, you can visit [Userpilot docs](https://docs.userpilot.com/article/23-identify-users-track-custom-events) for more information.',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: 'The ID of the logged-in user.',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'Anonymous user ID.',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'Segment traits',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const { traits, anonymousId, userId } = payload

    // Transform createdAt to Userpilot reserved property
    if (traits?.createdAt !== undefined) {
      traits.created_at = traits.createdAt
      delete traits.createdAt
    }

    const { url, options } = getIdentifyRequestParams(settings, { traits, anonymousId, userId })

    return request(url, options)
  }
}

export default action
