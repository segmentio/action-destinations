import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HeapApi } from '../types'

const action: BrowserActionDefinition<Settings, HeapApi, Payload> = {
  title: 'Identify User',
  description: 'Sets user identity',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: "The user's identity",
      label: 'Identity',
      default: {
        '@path': '$.userId'
      }
    }
  },
  perform: (heap, event) => {
    if (event.payload.userId) {
      heap.identify(event.payload.userId)
    }
  }
}

export default action
