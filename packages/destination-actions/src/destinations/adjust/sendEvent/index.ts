import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendEvents, validatePayload } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Sends an Event to Adjust.',
  defaultSubscription: 'type = "track" and event = "Conversion Completed"',
  fields: {
    timestamp: {
      label: 'Timestamp',
      description: 'Timestamp for when the event happened.',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      },
      required: false
    },
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
      description:
        'The name of the Segment library used to trigger the event. E.g. "analytics-ios" or "analytics-android".',
      type: 'string',
      default: {
        '@path': '$.context.library.name'
      },
      required: false
    },
    revenue: {
      label: 'Revenue',
      description:
        'The revenue amount of the event. E.g. 75.5 for $75.50. Currency can be set with the "Currency field".',
      type: 'number',
      required: false,
      default: { '@path': '$.properties.revenue' }
    },
    currency: {
      label: 'Currency',
      description: 'The revenue currency. Only set if revenue is also set. E.g. "USD" or "EUR".',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.currency' }
    }
  },
  perform: (request, data) => {
    const adjustPayload = validatePayload(data.payload, data.settings)
    return sendEvents(request, [adjustPayload])
  }
}

export default action
