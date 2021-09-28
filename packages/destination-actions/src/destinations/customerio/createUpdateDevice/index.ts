import dayjs from '../../../lib/dayjs'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { trackApiEndpoint } from '../utils'

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
    },
    convert_timestamp: {
      label: 'Convert timestamps',
      description: 'Convert `last_used` to a Unix timestamp (seconds since Epoch).',
      type: 'boolean',
      default: true
    }
  },

  perform: (request, { settings, payload }) => {
    let lastUsed: string | number | undefined = payload.last_used

    if (lastUsed && payload.convert_timestamp !== false) {
      lastUsed = dayjs.utc(lastUsed).unix()
    }

    return request(
      `${trackApiEndpoint(settings.accountRegionEndpoint)}/api/v1/customers/${payload.person_id}/devices`,
      {
        method: 'put',
        json: {
          device: {
            id: payload.device_id,
            platform: payload.platform,
            last_used: lastUsed
          }
        }
      }
    )
  }
}

export default action
