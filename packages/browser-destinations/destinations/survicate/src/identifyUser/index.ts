import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Identify User',
  description: '',
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
