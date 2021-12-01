import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { StackAdaptSDK } from '../types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, StackAdaptSDK, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  platform: 'web',
  defaultSubscription: 'type = "track"',
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
  perform: (saq, event) => {
    const pixelId = event.settings.universalPixelId

    saq('ts', pixelId, {
      eventName: event.payload.eventName,
      ...(event.payload.eventProperties ?? {})
    })
  }
}

export default action
