import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../utils/constants'
import dayjs from '../../../lib/dayjs'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Group',
  description: 'Updates or adds properties to a group. Group is created if it does not exist.',
  defaultSubscription: 'type = "group"',
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
    group_id: {
      label: 'Group ID',
      type: 'string',
      description: 'The unique identifier of the group.',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      label: 'Group Properties',
      type: 'object',
      description: 'The properties to set on the group profile.',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    const datetime = payload.time
    const time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()

    return await request(`${API_URL}/group/identify`, {
      method: 'post',
      json: {
        companyId: settings.companyId,
        key: settings.segmentKey,
        group: { time, group_id: payload.group_id, traits: payload.traits }
      }
    })
  }
}

export default action
