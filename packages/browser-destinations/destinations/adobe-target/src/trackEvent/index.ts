import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Adobe } from '../types'
import { setMbox3rdPartyId, serializeProperties } from '../utils'

// Adobe Target only takes certain event types as valid parameters. We are defaulting to "display".
// Beware of changing it since other event types drop the event properties from AT's audience builder.

const TARGET_EVENT_TYPE = 'display'

const action: BrowserActionDefinition<Settings, Adobe, Payload> = {
  title: 'Track Event',
  description: 'Send user actions, such as clicks and conversions, to Adobe Target.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    type: {
      label: 'Event Type',
      description: 'The event type. Please ensure the type entered here is registered and available.',
      type: 'string',
      default: TARGET_EVENT_TYPE
    },
    eventName: {
      label: 'Event Name',
      description: 'This will be sent to Adobe Target as an event parameter called "event_name".',
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Event Parameters',
      description: 'Parameters specific to the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    userId: {
      type: 'string',
      description:
        'A user’s unique visitor ID. Setting an Mbox 3rd Party ID allows for updates via the Adobe Target Cloud Mode Destination. For more information, please see our Adobe Target Destination documentation.',
      label: 'Mbox 3rd Party ID',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    }
  },
  perform: (Adobe, event) => {
    const payload = event.payload
    setMbox3rdPartyId(payload.userId)

    const event_params = {
      ...serializeProperties(payload.properties),
      event_name: payload.eventName
    }

    const params = {
      mbox: event.settings.mbox_name,
      preventDefault: true,
      params: event_params,
      type: payload.type
    }

    Adobe.target.trackEvent(params)
  }
}

export default action
