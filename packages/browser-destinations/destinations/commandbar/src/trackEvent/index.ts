import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import { CommandBarClientSDK } from '../types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, CommandBarClientSDK, Payload> = {
  title: 'Track Event',
  description: "Submit an event's properties as CommandBar metaData.",
  platform: 'web',
  defaultSubscription: 'type = "track"',

  fields: {
    event_name: {
      description: 'The name of the event.',
      label: 'Event Name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    event_metadata: {
      description: 'Optional metadata describing the event.',
      label: 'Event Metadata',
      type: 'object',
      required: false,
      default: {
        '@path': '$.properties'
      }
    }
  },

  perform: (CommandBar, event) => {
    if (event.payload.event_name) {
      CommandBar.trackEvent(event.payload.event_name, event.payload.event_metadata || {})
    }
  }
}

export default action
