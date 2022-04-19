import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HeapApi } from '../types'
import { HEAP_LIBRARY_NAME } from '../constants'

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
    }
  },
  perform: (heap, event) => {
    heap.track(event.payload.name, event.payload.properties ?? {}, HEAP_LIBRARY_NAME)
  }
}

export default action
