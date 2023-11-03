import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../utils/constants'
import dayjs from '../../../lib/dayjs'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Alias',
  description: 'Create an alias to a user id. Used when a single user has been initially identified as several users.',
  fields: {
    time: {
      label: 'Timestamp',
      type: 'datetime',
      description:
        'The timestamp of the event. Could be any date string/number value compatible with JavaScript Date constructor: e.g. milliseconds epoch or an ISO datetime. If time is not sent with the event, it will be set to the request time.',
      default: {
        '@path': '$.timestamp'
      }
    },
    new_id: {
      label: 'New ID',
      type: 'string',
      allowNull: true,
      description:
        'A new user id to be merged with the original distinct id. Each alias can only map to one distinct id.',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    previous_id: {
      label: 'Previous ID',
      type: 'string',
      description: 'A previous user id to be merged with the alias.',
      default: {
        '@path': '$.previousId'
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    const datetime = payload.time
    const time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()

    return await request(`${API_URL}/user/alias`, {
      method: 'post',
      json: {
        companyId: settings.companyId,
        key: settings.segmentKey,
        alias: {
          time,
          new_id: payload.new_id,
          previous_id: payload.previous_id
        }
      }
    })
  }
}

export default action
