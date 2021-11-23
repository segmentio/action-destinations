import type { BrowserActionDefinition } from '../../../lib/browser-destinations'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createSignUpPayload, trackSignUpFields } from '../shared/sharedSignUp'

// see https://segment.com/docs/config-api/fql/
export const trackSignUpDefaultSubscription = 'event = "Signed Up"'

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Sign Up',
  description: 'Record when a customer signs up for a service.',
  defaultSubscription: trackSignUpDefaultSubscription,
  platform: 'web',
  fields: trackSignUpFields,

  perform: (friendbuyAPI, data) => {
    const friendbuyPayload = createSignUpPayload(data.payload)
    friendbuyAPI.push(['track', 'sign_up', friendbuyPayload, true])
  }
}

export default action
