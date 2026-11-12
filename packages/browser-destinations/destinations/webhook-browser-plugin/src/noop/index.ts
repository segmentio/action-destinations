import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'No-op',
  description: 'Does nothing.',
  platform: 'web',
  fields: {},
  perform: () => {
    return {}
  }
}

export default action
