import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { StackAdaptSDK } from '../types'
import type { Payload } from './generated-types'

export const trackEventDefaultSubscription = 'type = "track"'

const action: BrowserActionDefinition<Settings, StackAdaptSDK, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  platform: 'web',
  defaultSubscription: trackEventDefaultSubscription,
  fields: {
    eventName: {
      description: 'The name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    eventProperties: {
      type: 'object',
      required: false,
      description: 'Hash of properties for this event.',
      label: 'Event Properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (saq, { settings, payload }) => {
    const pixelId = settings.universalPixelId

    saq('ts', pixelId, {
      eventName: payload.eventName,
      ...(payload.eventProperties ?? {})
    })
  }
}

export default action
