import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { getTrackEventParams } from '../request-utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description:
    'Send an event to Userpilot, you can visit [Userpilot docs](https://docs.userpilot.com/article/23-identify-users-track-custom-events) for more information',
  defaultSubscription: 'type = "track"',
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
    name: {
      type: 'string',
      required: true,
      description: 'Event name',
      label: 'Name',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Event properties',
      label: 'Properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const { userId, name, properties } = payload
    const { url, options } = getTrackEventParams(settings, { userId, name, properties })

    return request(url, options)
  }
}

export default action
