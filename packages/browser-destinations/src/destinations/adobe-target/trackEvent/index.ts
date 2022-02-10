import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Adobe } from '../types'

const action: BrowserActionDefinition<Settings, Adobe, Payload> = {
  title: 'Track Event',
  description: 'Track an event',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    type: {
      label: 'Event Name',
      description: 'Event type or name.',
      type: 'string',
      default: {
        '@path': '@.type'
      }
    },
    properties: {
      label: 'Event Parameters',
      description: 'Parameters specific to the event.',
      type: 'object',
      default: {
        '@path': '@.properties'
      }
    }
  },
  perform: (Adobe, event) => {
    // Adobe Target only takes certain event types as valid parameters. We are defaulting to "click".
    const TARGET_EVENT_TYPE = 'click'
    const event_params = {
      ...event.payload.properties,
      event_name: event.payload.type
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
