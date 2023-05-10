import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HeapApi } from '../types'
import { HEAP_SEGMENT_BROWSER_LIBRARY_NAME } from '../constants'
import { isDefined, flat } from '../utils'

const action: BrowserActionDefinition<Settings, HeapApi, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'A JSON object containing additional information about the event that will be indexed by Heap.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    identity: {
      type: 'string',
      required: false,
      label: 'Identity',
      description:
        'a string that uniquely identifies a user, such as an email, handle, or username. This means no two users in one environment may share the same identity. More on identify: https://developers.heap.io/docs/using-identify'
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'The segment anonymous identifier for the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      description:
        'An object with key-value properties you want associated with the user. Each property must either be a number or string with fewer than 1024 characters.',
      default: {
        '@path': '$.context.traits'
      }
    }
  },
  perform: (heap, event) => {
    const eventProperties = Object.assign({}, event.payload.properties)
    eventProperties.segment_library = HEAP_SEGMENT_BROWSER_LIBRARY_NAME
    if (event.payload.anonymousId || isDefined(event.payload?.traits)) {
      const traits = flat(event.payload?.traits)
      heap.addUserProperties({
        ...(isDefined(event.payload.anonymousId) && { anonymous_id: event.payload.anonymousId }),
        ...(isDefined(traits) && traits)
      })
    }
    if (event.payload?.identity && isDefined(event.payload?.identity)) {
      heap.identify(event.payload.identity)
    }
    heap.track(event.payload.name, eventProperties)
  }
}

export default action
