import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import type { DestinationDefinition } from '@segment/actions-core'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { defaultValues } from '@segment/actions-core'

import type { Settings } from './generated-types'
import type { FriendbuyAPI } from './types'
import trackCustomer, { trackCustomerDefaultSubscription } from './trackCustomer'
import trackPurchase, { browserTrackPurchaseFields, trackPurchaseDefaultSubscription } from './trackPurchase'
import trackSignUp, { browserTrackSignUpFields, trackSignUpDefaultSubscription } from './trackSignUp'
import trackPage, { trackPageDefaultSubscription, trackPageFields } from './trackPage'
import trackCustomEvent from './trackCustomEvent'
import { trackCustomerFields } from '@segment/actions-shared'

declare global {
  interface Window {
    friendbuyAPI?: FriendbuyAPI
    friendbuyBaseHost?: string
  }
}

// Presets are shown in Segment configuration flow as "Pre-Built Subscriptions".
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Customer',
    subscribe: trackCustomerDefaultSubscription,
    partnerAction: 'trackCustomer',
    mapping: defaultValues(trackCustomerFields),
    type: 'automatic'
  },
  {
    name: 'Track Purchase',
    subscribe: trackPurchaseDefaultSubscription,
    partnerAction: 'trackPurchase',
    mapping: defaultValues(browserTrackPurchaseFields),
    type: 'automatic'
  },
  {
    name: 'Track Sign Up',
    subscribe: trackSignUpDefaultSubscription,
    partnerAction: 'trackSignUp',
    mapping: defaultValues(browserTrackSignUpFields),
    type: 'automatic'
  },
  {
    name: 'Track Page',
    subscribe: trackPageDefaultSubscription,
    partnerAction: 'trackPage',
    mapping: defaultValues(trackPageFields),
    type: 'automatic'
  }
]

export const destination: BrowserDestinationDefinition<Settings, FriendbuyAPI> = {
  name: 'Friendbuy (Actions)',
  slug: 'actions-friendbuy',
  mode: 'device',

  settings: {
    merchantId: {
      label: 'Friendbuy Merchant ID',
      description:
        'Find your Friendbuy Merchant ID by logging in to your [Friendbuy account](https://retailer.friendbuy.io/) and going to Developer Center > Friendbuy Code.',
      type: 'string',
      format: 'uuid',
      required: true
    }
  },

  initialize: async ({ settings /* , analytics */ }, dependencies) => {
    let friendbuyAPI: FriendbuyAPI
    window.friendbuyAPI = friendbuyAPI = window.friendbuyAPI || ([] as unknown as FriendbuyAPI)
    const friendbuyBaseHost = window.friendbuyBaseHost ?? 'fbot.me'

    friendbuyAPI.merchantId = settings.merchantId
    friendbuyAPI.push(['merchant', settings.merchantId])

    // The Friendbuy JavaScript can be loaded asynchronously.
    void dependencies.loadScript(`https://static.${friendbuyBaseHost}/friendbuy.js`)
    void dependencies.loadScript(`https://campaign.${friendbuyBaseHost}/${settings.merchantId}/campaigns.js`)

    return friendbuyAPI
  },

  presets,
  actions: {
    trackCustomer,
    trackPurchase,
    trackSignUp,
    trackPage,
    trackCustomEvent
  }
}

export default browserDestination(destination)
