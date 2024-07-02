import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendBatch, sendSingle } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Device',
  description: `Delete a person's device.`,
  defaultSubscription: 'event = "Application Uninstalled" or event = "Device Deleted"',
  fields: {
    person_id: {
      label: 'Person ID',
      description: 'The ID of the person that this mobile device belongs to.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    device_id: {
      label: 'Device ID',
      description: "The device token of a customer's mobile device.",
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.device.token'
      }
    }
  },

  performBatch: (request, { payload: payloads, settings }) => {
    return sendBatch(
      request,
      payloads.map((payload) => ({ action: 'delete_device', payload: mapPayload(payload), settings, type: 'person' }))
    )
  },

  perform: (request, { payload, settings }) => {
    return sendSingle(request, { action: 'delete_device', payload: mapPayload(payload), settings, type: 'person' })
  }
}

function mapPayload(payload: Payload) {
  const { device_id, ...rest } = payload

  return {
    ...rest,
    device: {
      token: device_id
    }
  }
}

export default action
