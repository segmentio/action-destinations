import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type appboy from '@braze/web-sdk'

const action: BrowserActionDefinition<Settings, typeof appboy, Payload> = {
  title: 'Log Custom Event',
  description: 'Reports that the current user performed a custom named event.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    eventName: {
      type: 'string',
      required: true,
      description: 'The identifier for the event to track.',
      label: 'eventName',
      default: 'event'
    },
    eventProperties: {
      type: 'object',
      required: false,
      description: 'Hash of properties for this event.',
      label: 'eventProperties',
      default: {}
    }
  },
  perform: (client, event) => {
    client.logCustomEvent(event.payload.eventName, event.payload.eventProperties)
  }
}

export default action
