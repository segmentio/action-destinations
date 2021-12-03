import type { BrowserActionDefinition } from '../../../lib/browser-destinations'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createCustomEventPayload, trackCustomEventFields } from '../shared/sharedCustomEvent'

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Custom Event',
  description: 'Record when a customer completes any custom event.',
  // trackCustomEvent has no default subscription.
  platform: 'web',
  fields: trackCustomEventFields,

  perform: (friendbuyAPI, data) => {
    const friendbuyPayload = createCustomEventPayload(data.payload)
    friendbuyAPI.push(['track', data.payload.eventType, friendbuyPayload])
  }
}

export default action
