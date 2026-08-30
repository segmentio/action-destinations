import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { KochavaAction } from '../constants'
import { sendEvent } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post-Install Event',
  description: 'Send a post-install in-app event (e.g. purchase, subscription) to Kochava.',
  defaultSubscription: 'type = "track" and event != "Application Installed"',
  fields: {
    ...commonFields,
    event_name: {
      label: 'Event Name',
      description: 'The name of the event.',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    event_data: {
      label: 'Event Data',
      description: 'Free-form event values (e.g. id, name, sum) associated with the event.',
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    currency: {
      label: 'Currency',
      description: 'The currency code for revenue events (e.g. "USD").',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.currency' }
    },
    ad_tracking_enabled: {
      label: 'Ad Tracking Enabled',
      description:
        'Whether ad tracking is enabled on the device. Sent to Kochava as the inverse (device_limit_tracking).',
      type: 'boolean',
      required: false,
      default: { '@path': '$.context.device.adTrackingEnabled' }
    }
  },
  perform: (request, { payload, settings }) => {
    return sendEvent(request, settings, payload, KochavaAction.Event)
  }
}

export default action
