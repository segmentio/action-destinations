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
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    createdAt: {
      type: 'datetime',
      required: false,
      description: 'The date the user profile was created at',
      label: 'User Created At Date',
      default: {
        '@path': '$.traits.createdAt'
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
    const { traits, userId, createdAt } = payload

    traits?.createdAt && delete traits.createdAt

    const { url, options } = getIdentifyRequestParams(settings, {
      traits: { ...traits, created_at: createdAt || traits?.created_at },
      userId
    })

    return request(url, options)
  }
}

export default action
