import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Wingify } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sanitiseEventName } from '../utility'

const action: BrowserActionDefinition<Settings, Wingify, Payload> = {
  title: 'Track Event',
  description: `Sends Segment's track event to Wingify`,
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    eventName: {
      description: 'Name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'JSON object containing additional properties that will be associated with the event.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (_, event) => {
    const { eventName, properties } = event.payload
    const sanitisedEventName = sanitiseEventName(eventName)
    const formattedProperties = { ...properties }

    window.Wingify = window.Wingify || []

    window.Wingify.event =
      window.Wingify.event ||
      function (...args) {
        window.Wingify.push(['event', ...args])
      }

    window.Wingify.event(sanitisedEventName, formattedProperties, {
      source: 'segment.web',
      ogName: eventName
    })
  }
}

export default action
