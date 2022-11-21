import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { VWO } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, VWO, Payload> = {
  title: 'Track Event',
  description: 'Forwards track events to VWO Data360',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    eventName: {
      description: 'The name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'A JSON object containing additional properties that will be associated with the event.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (VWO, event) => {
    const { eventName, properties } = event.payload
    const formattedProperties = { ...properties }
    formattedProperties['source'] = `segment.web`
    if (!VWO.event) {
      return
    }
    VWO.event(eventName, formattedProperties)
  }
}

export default action
