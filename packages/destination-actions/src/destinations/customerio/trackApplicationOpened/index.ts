import dayjs from '../../../lib/dayjs'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { trackApiEndpoint } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Application Opened Event',
  description: `Track an "Application Opened" event, and create or update a person's device in Customer.io.`,
  defaultSubscription: 'type = "track" and event = "Application Opened"',
  fields: {
    person_id: {
      label: 'Person ID',
      description: 'The ID of the person that this mobile device belongs to',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    device_id: {
      label: 'Device ID',
      description: "The device token of a customer's mobile device",
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.device.id'
      }
    },
    platform: {
      label: 'Platform',
      description: `The mobile device's platform. ("ios" or "android")`,
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.device.type'
      }
    },
    last_used: {
      label: 'Last Used',
      description: 'The timestamp for when the mobile device was last used. Default is current date and time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    convert_timestamp: {
      label: 'Convert Timestamps',
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

    return request(`${trackApiEndpoint(settings.accountRegion)}/api/v1/customers/${payload.person_id}/devices`, {
      method: 'put',
      json: {
        device: {
          id: payload.device_id,
          platform: payload.platform,
          last_used: lastUsed
        }
      }
    })
  }
}

export default action
