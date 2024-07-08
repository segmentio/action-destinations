import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendEvents, validatePayload } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Sends an Event to Adjust.',
  fields: {
    app_token: {
      label: 'App Token',
      description: 'The app token for your Adjust account. Overrides the Default App Token from Settings.',
      type: 'string',
      required: false
    },
    event_token: {
      label: 'Event Token',
      description: 'The event token. Overrides the Default Event Token from Settings.',
      type: 'string',
      required: false
    },
    device_id: {
      label: 'Device ID',
      description: 'The unique device identifier',
      type: 'string',
      default: {
        '@path': '$.context.device.id'
      },
      required: true
    },
    advertising_id: {
      label: 'Advertising ID',
      description: 'The advertising identifier ("idfa" for iOS, "gps_adid" for Android).',
      type: 'string',
      default: {
        '@path': '$.context.device.advertisingId'
      },
      required: true
    },
    device_type: {
      label: 'Device Type',
      description: 'The device type. Options: "ios" or "android".',
      type: 'string',
      default: {
        '@path': '$.context.device.type'
      },
      required: true
    },
    library_name: {
      label: 'Library Name',
      description: 'The name of the library. Suggestions: "analytics-ios" or "analytics-android".',
      type: 'string',
      default: {
        '@path': '$.context.library.name'
      },
      required: false
    },
    revenue: {
      label: 'Revenue',
      description: 'The revenue amount.',
      type: 'number',
      required: false
    },
    currency: {
      label: 'Currency',
      description: 'The currency of the revenue. Only set if revenue is also set.',
      type: 'string',
      required: false
    }
  },
  perform: (request, data) => {
    const eventData = (data as any).rawData as { [key: string]: unknown }
    const adjustPayload = validatePayload(data.payload, eventData, data.settings)
    return sendEvents(request, [adjustPayload])
  }
}

export default action
