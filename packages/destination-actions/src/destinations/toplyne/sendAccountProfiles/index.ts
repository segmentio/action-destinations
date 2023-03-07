import type { ActionDefinition } from '@segment/actions-core'
import dayjs from 'dayjs'
import { baseUrl } from '../constants'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Account Profiles',
  description: 'Send group calls to Toplyne',
  defaultSubscription: 'type = "group"',
  fields: {
    accountId: {
      type: 'string',
      label: 'Account ID',
      description: 'The ID of the account to send properties for',
      required: true,
      default: { '@path': '$.groupId' }
    },
    creationTime: {
      type: 'datetime',
      label: 'Creation time',
      description: 'Toplyne calculates the creation time using the timestamp of the first event or group call',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    accountProperties: {
      type: 'object',
      label: 'Account Properties',
      description: 'The properties of the account',
      required: false,
      default: { '@path': '$.traits' }
    }
  },

  perform: (request, data) => {
    // Send a single account profile
    return request(`${baseUrl}/upload/accounts/profiles`, {
      json: {
        accounts: [
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
