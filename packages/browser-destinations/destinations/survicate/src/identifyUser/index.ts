import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Survicate } from 'src/types'

const action: BrowserActionDefinition<Settings, Survicate, Payload> = {
  title: 'Identify User',
  description: 'Set visitor traits with Segment Identify event',
  defaultSubscription: 'type = "identify" or type = "group"',
  platform: 'web',
  fields: {
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to Survicate',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (_, { payload }) => {
    if (window._sva) {
      window._sva.setVisitorTraits(payload.traits)
    }
  }
}

export default action
