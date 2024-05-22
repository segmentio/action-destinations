import type { ActionDefinition } from '@segment/actions-core'
import AppFitConfig from '../config'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Send an event to AppFit.',
  fields: {
    userId: {
      label: 'External User ID',
      description: 'The unique user identifier',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    occurredAt: {
      label: 'Time',
      description: 'When the event occurred.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    name: {
      label: 'Event Name',
      description: 'The event name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'The anonymous ID of the user',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'Properties of the event',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    appVersion: {
      label: 'App Version',
      description: 'The app version',
      type: 'string',
      default: {
        '@path': '$.context.app.version'
      }
    },
    deviceId: {
      label: 'Device ID',
      description: 'The device ID of the user',
      type: 'string',
      default: {
        '@path': '$.context.device.id'
      }
    },
    deviceType: {
      label: 'Device Type',
      description: 'The device type',
      type: 'string',
      default: {
        '@path': '$.context.device.type'
      }
    },
    deviceManufacturer: {
      label: 'Device Manufacturer',
      description: 'The device manufacturer',
      type: 'string',
      default: {
        '@path': '$.context.device.manufacturer'
      }
    },
    deviceModel: {
      label: 'Device Model',
      description: 'The device model',
      type: 'string',
      default: {
        '@path': '$.context.device.model'
      }
    },
    deviceAdvertisingId: {
      label: 'Device Advertising ID',
      description: 'The device advertising ID',
      type: 'string',
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    ipAddress: {
      label: 'IP Address',
      description: 'The IP address of the client',
      type: 'string',
      default: {
        '@path': '$.context.ip'
      }
    },
    osName: {
      label: 'OS Name',
      description: 'The name of the operating system',
      type: 'string',
      default: {
        '@path': '$.context.os.name'
      }
    },
    osVersion: {
      label: 'OS Version',
      description: 'The version of the operating system',
      type: 'string',
      default: {
        '@path': '$.context.os.version'
      }
    },
    eventId: {
      label: 'Event ID',
      description: 'The event ID',
      type: 'string',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    return request(`${AppFitConfig.apiUrl}/metric-events`, {
      method: 'POST',
      headers: { Authorization: `Basic ${settings.apiKey}` },

      json: {
        eventSource: 'segment',
        occurredAt: payload.occurredAt,
        payload: {
          version: '2',
          sourceEventId: payload.eventId,
          eventName: payload.name,
          userId: payload.userId,
          anonymousId: payload.anonymousId,
          properties: payload.properties,
          systemProperties: {
            appVersion: payload.appVersion,
            ipAddress: payload.ipAddress,
            os: {
              name: payload.osName,
              version: payload.osVersion
            },
            device: {
              id: payload.deviceId,
              advertisingId: payload.deviceAdvertisingId,
              manufacturer: payload.deviceManufacturer,
              model: payload.deviceModel
            }
          }
        }
      }
    })
  }
}

export default action
