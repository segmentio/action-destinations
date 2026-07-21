import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { FUS, UserCustomAttributes } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, FUS, Payload> = {
  title: 'Page View',
  description: 'Track page views and set page-specific attributes in FullSession for navigation analysis.',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {
    properties: {
      type: 'object',
      required: false,
      description: 'Properties and metadata associated with the page being viewed',
      label: 'Page Properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (FUS, data) => {
    const { properties } = data.payload
    FUS.setPageAttributes({
      ...properties
    } as UserCustomAttributes)
  }
}

export default action
