import type { ActionDefinition } from '@segment/actions-core'
import dayjs from 'dayjs'
import chunk from 'lodash/chunk'
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
      description: 'The ID of the user to send properties for',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    creationTime: {
      type: 'datetime',
      label: 'Creation time',
      description: 'Creation time, for segment the event timestamp',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    userProperties: {
      type: 'object',
      label: 'User Properties',
      description: 'The properties of the user',
      required: false,
      default: { '@path': '$.traits' }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Send multiple profiles in a single request',
      description:
        'When enabled, the action will send upto 100 profiles in a single request. When disabled, the action will send 1 profile per request.',
      default: true
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
  },
  performBatch: (request, data) => {
    // Send multiple user profiles
    const profileChunks = chunk(data.payload, 100)
    return Promise.all(
      profileChunks.map((profileChunk) =>
        request(`${baseUrl}/upload/users/profiles`, {
          json: {
            profiles: profileChunk.map((payload) => ({
              ...payload,
              /**
               * Toplyne API expects a creationTime in Unix time (seconds since epoch)
               */
              creationTime: dayjs(payload.creationTime).unix()
            }))
          }
        })
      )
    )
  }
}

export default action
