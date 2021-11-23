import type { BrowserActionDefinition } from '../../../lib/browser-destinations'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createPurchasePayload, trackPurchaseFields } from '../shared/sharedPurchase'

// see https://segment.com/docs/config-api/fql/
export const trackPurchaseDefaultSubscription = 'event = "Order Completed"'

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Purchase',
  description: 'Record when a customer makes a purchase.',
  defaultSubscription: trackPurchaseDefaultSubscription,
  platform: 'web',
  fields: trackPurchaseFields,

  perform: (friendbuyAPI, data) => {
    const friendbuyPayload = createPurchasePayload(data.payload)
    friendbuyAPI.push(['track', 'purchase', friendbuyPayload, true])
  }
}

export default action
