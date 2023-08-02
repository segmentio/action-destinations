import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import { Hubspot } from '../types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, Hubspot, Payload> = {
  title: 'Track Page View',
  description: 'Track the page view for the current page in HubSpot.',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {
    path: {
      description:
        'The path of the current page. The set path will be treated as relative to the current domain being viewed.',
      label: 'Path String',
      type: 'string',
      required: false
    }
  },
  perform: (_hsq, event) => {
    if (event.payload.path) {
      _hsq.push(['setPath', event.payload.path])
    }
    _hsq.push(['trackPageView'])
  }
}

export default action
