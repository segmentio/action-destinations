import dayjs from '../../../lib/dayjs'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Device',
  description: "Update a person's device in Customer.io or create it if it doesn't exist.",
  defaultSubscription: 'type = "track" and event = "Application Installed"',
  fields: {
    person_id: {
      label: 'Person ID',
      description: 'ID of the person that this device belongs to.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    device_id: {
      label: 'Device ID',
      description: 'Unique ID for this device.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.device.id'
      }
    },
    platform: {
      label: 'Platform',
      description: 'The device platform.',
      type: 'string',
      required: true,
      // enum: ['ios', 'android'],
      default: {
        '@path': '$.context.device.type'
      }
    },
    last_used: {
      label: 'Last Used',
      description: 'Timestamp for when the device was last used. Default is current date and time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    }
  },

  perform: (request, { payload }) => {
    return request(`https://track.customer.io/api/v1/customers/${payload.person_id}/devices`, {
      method: 'put',
      json: {
        device: {
          id: payload.device_id,
          platform: payload.platform,
          last_used: payload.last_used ? dayjs.utc(payload.last_used).format('X') : undefined
        }
      }
    })
  }
}

export default action
