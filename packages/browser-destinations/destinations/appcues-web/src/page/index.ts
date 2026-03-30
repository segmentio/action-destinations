import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Appcues } from '../types'

const action: BrowserActionDefinition<Settings, Appcues, Payload> = {
  title: 'Page',
  description: 'Send Segment page events to Appcues.',
  platform: 'web',
  fields: {},
  defaultSubscription: 'type = "page"',
  perform: (appcues) => {
    appcues.page()
  }
}

export default action
