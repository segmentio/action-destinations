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
    osName: {
      label: 'OS Name',
      description: 'The name of the operating system',
      type: 'string',
      default: {
        '@path': '$.context.os.name'
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
          eventId: payload.eventId,
          userId: payload.userId,
          anonymousId: payload.anonymousId,
          name: payload.name,
          properties: payload.properties,
          deviceId: payload.deviceId,
          deviceType: payload.deviceType,
          osName: payload.osName
        }
      }
    })
  }
}

export default action
