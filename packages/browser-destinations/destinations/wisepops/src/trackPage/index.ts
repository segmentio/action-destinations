import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Wisepops } from '../types'

const action: BrowserActionDefinition<Settings, Wisepops, Payload> = {
  title: 'Track Page',
  description:
    'Let Wisepops know when the visitor goes to a new page. This allows Wisepops to display campaigns at page change.',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {},
  perform: (wisepops) => {
    wisepops('pageview')
  }
}

export default action
