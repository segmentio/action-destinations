import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendBatch, sendSingle } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Device',
  description: `Create or update a person's device.`,
  defaultSubscription: 'type = "track" and event = "Application Installed"',
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
    },
    app_version: {
      label: 'App Version',
      description: 'The version of the App',
      type: 'string',
      default: {
        '@path': '$.context.app.version'
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
    attributes: {
      label: 'Event Attributes',
      description: `Optional data that you can reference to segment your audience, like a person's attributes, but specific to a device.`,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    convert_timestamp: {
      label: 'Convert Timestamps',
      description: 'Convert dates to Unix timestamps (seconds since Epoch).',
      type: 'boolean',
      default: true
    }
  },

  performBatch: (request, { payload: payloads, settings }) => {
    return sendBatch(
      request,
      payloads.map((payload) => ({ action: 'add_device', payload: mapPayload(payload), settings, type: 'person' }))
    )
  },

  perform: (request, { payload, settings }) => {
    return sendSingle(request, { action: 'add_device', payload: mapPayload(payload), settings, type: 'person' })
  }
}

function mapPayload(payload: Payload) {
  const { app_version, device_id, platform, last_used, attributes, ...rest } = payload

  return {
    ...rest,
    device: {
      token: device_id,
      platform,
      last_used,
      attributes: {
        ...attributes,
        ...(payload.app_version ? { app_version: payload.app_version } : {})
      }
    }
  }
}

export default action
