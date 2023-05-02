import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { VWO } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sanitiseEventName } from '../utility'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, VWO, Payload> = {
  title: 'Track Event',
  description: `Sends Segment's track event to VWO`,
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

    window.VWO = window.VWO || []

    if (!window.VWO.event) {
      window.VWO.event = function (...args) {
        window.VWO.push(['event', ...args])
      }
    }
    window.VWO.event(sanitisedEventName, formattedProperties, {
      source: 'segment.web',
      ogName: eventName
    })
  }
}

export default action
