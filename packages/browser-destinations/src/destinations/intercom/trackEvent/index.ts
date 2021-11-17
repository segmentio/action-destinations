import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Intercom } from '../api'

const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Track Event',
  description: 'This will associate the event with the currently logged in user and send it to Intercom',
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
  perform: (_, event) => {
    window.Intercom('trackEvent', event.payload.eventName, event.payload.eventProperties)
  }
}

export default action
