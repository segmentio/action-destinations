import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Koala } from '../types'

const action: BrowserActionDefinition<Settings, Koala, Payload> = {
  title: 'Identify Visitor',
  description: 'Update visitor traits in Koala.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the visitor in Koala.',
      required: true,
      default: { '@path': '$.traits' },
      defaultObjectUI: 'object'
    }
  },
  perform: (koala, { payload }) => {
    if (payload?.traits) {
      return koala.identify(payload.traits)
    }
  }
}

export default action
