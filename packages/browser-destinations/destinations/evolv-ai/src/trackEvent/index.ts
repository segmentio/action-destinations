import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Evolv } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sanitiseEventName } from '../utility'
import { emit } from '../proxy'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Evolv, Payload> = {
  title: 'Track Event',
  description: `Send Segment track event to Evolv AI`,
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
      description: 'JSON object containing additional properties associated with the event.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (_, event) => {
    const { eventName } = event.payload
    const sanitisedEventName = sanitiseEventName(eventName)

    emit(sanitisedEventName)
  }
}

export default action
