import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Sprig } from '../types'

const action: BrowserActionDefinition<Settings, Sprig, Payload> = {
  title: 'Sign Out User',
  description: 'Clear stored user ID so that future events and traits are not associated with this user.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Signed Out"',
  fields: {},
  perform: (Sprig, _event) => {
    Sprig('logoutUser')
  }
}

export default action
