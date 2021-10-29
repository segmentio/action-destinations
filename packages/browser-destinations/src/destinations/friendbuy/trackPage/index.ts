import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { FriendbuyAPI } from '..'
import { createFriendbuyPayload } from '../util'

export const trackPageDefaultSubscription = 'type = "page"'

// https://segment.com/docs/connections/spec/page/
export const trackPageFields: Record<string, InputField> = {
  name: {
    label: 'Page Name',
    description: 'The page name.',
    type: 'string',
    required: true,
    default: { '@path': '$.name' }
  },
  category: {
    label: 'Page Name',
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
  description: 'Record when a user visits a new page. Allows Friendbuy widget targeting by page name instead of URL.',
  defaultSubscription: trackPageDefaultSubscription,
  platform: 'web',
  fields: trackPageFields,

  perform: (friendbuyAPI, data) => {
    const friendbuyPayload = createFriendbuyPayload([
      ['name', data.payload.name],
      ['category', data.payload.category],
      ['title', data.payload.title]
    ])
    friendbuyAPI.push(['track', 'page', friendbuyPayload, true])
  }
}

export default action
