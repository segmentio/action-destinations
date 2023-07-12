import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Hubspot } from '../types'
import { flatten } from '../utils/flatten'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Hubspot, Payload> = {
  title: 'Track Custom Behavioral Event',
  description: 'Send a custom behavioral event to HubSpot.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description:
        'The internal event name assigned by HubSpot. This can be found in your HubSpot account. If the "Format Custom Behavioral Event Names" setting is enabled, Segment will automatically convert your Segment event name into the expected HubSpot internal event name format.',
      label: 'Event Name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'A list of key-value pairs that describe the event.',
      label: 'Event Properties',
      type: 'object',
      required: false,
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (_hsq, event) => {
    let { name, properties } = event.payload

    if (event.settings.formatCustomBehavioralEventNames) {
      name = `pe${event.settings.portalId}_${name.replace(/[\s.]+/g, '_').toLocaleLowerCase()}`
    }

    // for custom properties, we will:
    // remove any non-primitives, replace spaces and dots with underscores, then lowercase
    properties = properties && flatten(properties, '', [], (key) => key.replace(/[\s.]+/g, '_').toLocaleLowerCase())

    _hsq.push(['trackCustomBehavioralEvent', { name, properties }])
  }
}

export default action
