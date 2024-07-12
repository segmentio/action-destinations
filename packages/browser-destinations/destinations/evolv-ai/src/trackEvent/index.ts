import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Evolv } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sanitiseEventName } from '../utility'
import { emit } from '../proxy'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Evolv, Payload> = {
  title: 'Track Event',
  description: `Sends Segment's track event to Evolv`,
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
    },
    userId: {
      type: 'string',
      description: 'A user’s unique visitor ID. Setting this allows .',
      label: '',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    }
  },
  perform: (_, event) => {
    const { eventName } = event.payload
    const sanitisedEventName = sanitiseEventName(eventName)

    // if (window.evolv && !window.evolv.instancesCount){
    //   window.evolv.setUid(event.payload.userId);
    // }
    emit(sanitisedEventName)
  }
}

export default action
