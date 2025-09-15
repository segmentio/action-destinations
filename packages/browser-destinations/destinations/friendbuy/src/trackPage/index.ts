import type { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createFriendbuyPayload } from '@segment/actions-shared'

export const trackPageDefaultSubscription = 'type = "page"'

// https://segment.com/docs/connections/spec/page/
export const trackPageFields: Record<string, InputField> = {
  name: {
    label: 'Page Name',
    description: 'The page name.',
    type: 'string',
    required: false,
    default: { '@path': '$.name' }
  },
  category: {
    label: 'Page Category',
    description: 'The page category.',
    type: 'string',
    required: false,
    default: { '@path': '$.category' }
  },
  title: {
    label: 'Page Title',
    description: 'The page title.',
    type: 'string',
    required: false,
    default: { '@path': '$.properties.title' }
  }
}

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Page',
  description:
    'Record when a customer visits a new page. Allow Friendbuy widget targeting by Page Name instead of URL.',
  defaultSubscription: trackPageDefaultSubscription,
  platform: 'web',
  fields: trackPageFields,

  perform: (friendbuyAPI, data) => {
    // If the page name is not defined then track the page with the name
    // "undefined".  This is intended to allow merchants to target their widgets
    // using page names when not all of their `analytics.page` calls include the
    // page name.
    const friendbuyPayload = createFriendbuyPayload([
      ['name', data.payload.name || 'undefined'],
      ['category', data.payload.category],
      ['title', data.payload.title]
    ])
    friendbuyAPI.push(['track', 'page', friendbuyPayload, true])
  }
}

export default action
