import type { ActionDefinition } from '@segment/actions-core'
import dayjs from 'dayjs'
import { baseUrl } from '../constants'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send user profiles',
  description: 'Send identify calls to Toplyne',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      label: 'User ID',
      description: 'The ID of the user to send properties for. Required if anonymousId is not provided',
      required: false,
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      type: 'string',
      label: 'Anonymous ID',
      description: 'The anonymous ID of the user to send properties for. Required if userId is not provided',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    creationTime: {
      type: 'datetime',
      label: 'Creation time',
      description:
        'Toplyne calculates the creation time of the user using the timestamp of the first track or identify call',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    userProperties: {
      type: 'object',
      label: 'User Properties',
      description: 'The properties of the user',
      required: false,
      default: { '@path': '$.traits' }
    }
  },
  perform: (request, data) => {
    // Send a single user profile
    return request(`${baseUrl}/upload/users/profiles`, {
      json: {
        profiles: [
          {
            ...data.payload,
            /**
             * Toplyne API expects a creationTime in Unix time (seconds since epoch)
             */
            creationTime: dayjs(data.payload.creationTime).unix()
          }
        ]
      }
    })
  }
}

export default action
