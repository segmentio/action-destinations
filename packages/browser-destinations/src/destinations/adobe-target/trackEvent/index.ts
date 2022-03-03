import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Adobe } from '../types'

const TARGET_EVENT_TYPE = 'click'

const action: BrowserActionDefinition<Settings, Adobe, Payload> = {
  title: 'Track Event',
  description: 'Track an event',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name: {
      label: 'Event Name',
      description: 'This will be sent to Adobe Target as an event parameter called "event_name".',
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    type: {
      label: 'Event Type',
      description: 'The event type. Please ensure the type entered here is registered and available.',
      type: 'string',
      default: TARGET_EVENT_TYPE
    },
    properties: {
      label: 'Event Parameters',
      description: 'Parameters specific to the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (Adobe, event) => {
    // Adobe Target only takes certain event types as valid parameters. We are defaulting to "click".
    const event_params = {
      ...event.payload.properties,
      event_name: event.payload.event_name
    }

    const params = {
      mbox: event.settings.mbox_name,
      preventDefault: true,
      params: event_params,
      type: TARGET_EVENT_TYPE
    }

    Adobe.target.trackEvent(params)
  }
}

export default action
