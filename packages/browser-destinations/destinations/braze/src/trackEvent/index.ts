import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { BrazeDestinationClient } from '../braze-types'

const action: BrowserActionDefinition<Settings, BrazeDestinationClient, Payload> = {
  title: 'Track Event',
  description: 'Reports that the current user performed a custom named event.',
  defaultSubscription: 'type = "track" and event != "Order Completed"',
  platform: 'web',
  fields: {
    eventName: {
      type: 'string',
      required: true,
      description: 'The identifier for the event to track.',
      label: 'Event Name',
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
  perform: (client, event) => {
    if (!client.ready()) {
      return
    }

    client.instance.logCustomEvent(event.payload.eventName, event.payload.eventProperties)
  }
}

export default action
