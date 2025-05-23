import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { PendoSDK } from '../types'

const action: BrowserActionDefinition<Settings, PendoSDK, Payload> = {
  title: 'Send Page Load Event',
  description: 'Send Segment page() events to Pendo',
  platform: 'web',
  fields: {
    url: {
      label: 'Page URL',
      description: 'The URL of the page being viewed. If not provided, the current URL will be used.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.page.url'
      }
    }
  },
  perform: (pendo, { payload }) => {
    pendo.pageLoad(payload.url ?? undefined)
  }
}

export default action
