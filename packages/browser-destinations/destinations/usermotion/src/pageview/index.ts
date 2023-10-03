import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { UserMotion } from '../types'

const action: BrowserActionDefinition<Settings, UserMotion, Payload> = {
  title: 'Track Page View',
  description: 'Track the page view for the current page in UserMotion.',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {
    properties: {
      type: 'object',
      required: false,
      description: 'Page properties',
      label: 'Properties',
      default: { '@path': '$.properties' }
    }
  },
  perform: (UserMotion, event) => {
    const { properties } = event.payload
    UserMotion.pageview(properties)
  }
}
export default action
