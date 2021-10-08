import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { trackApiEndpoint } from '../utils'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Device',
  description: `Track an "Application Uninstalled" event to delete a person's device.`,
  defaultSubscription: 'event = "Application Uninstalled"',
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
        '@path': '$.context.device.token'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    return request(
      `${trackApiEndpoint(settings.accountRegion)}/api/v1/customers/${payload.person_id}/devices/${payload.device_id}`,
      {
        method: 'delete'
      }
    )
  }
}

export default action
