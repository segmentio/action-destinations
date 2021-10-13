import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { defaultValues, DestinationDefinition } from '@segment/actions-core'

import trackCustomer, { trackCustomerDefaultSubscription, trackCustomerFields } from './trackCustomer'
import trackPurchase, { trackPurchaseDefaultSubscription, trackPurchaseFields } from './trackPurchase'

export interface FriendbuyAPI extends Array<unknown> {
  merchantId: string
}

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
    mapping: defaultValues(trackCustomerFields)
  },
  {
    name: 'Track Purchase',
    subscribe: trackPurchaseDefaultSubscription,
    partnerAction: 'trackPurchase',
    mapping: defaultValues(trackPurchaseFields)
  }
]

export const destination: BrowserDestinationDefinition<Settings, FriendbuyAPI> = {
  name: 'Friendbuy',
  slug: 'friendbuy',
  mode: 'device',

  settings: {
    merchantId: {
      label: 'Merchant ID',
      description: 'Your Friendbuy Merchant ID.',
      type: 'string',
      format: 'uuid',
      required: true
    }
  },

  initialize: async ({ settings /* , analytics */ }, dependencies) => {
    // console.log("friendbuy.initialize", settings)

    let friendbuyAPI: FriendbuyAPI
    window['friendbuyAPI'] = friendbuyAPI = window['friendbuyAPI'] || ([] as unknown as FriendbuyAPI)
    const friendbuyBaseHost = window.friendbuyBaseHost ?? 'fbot.me'

    friendbuyAPI.merchantId = settings.merchantId
    friendbuyAPI.push(['merchant', settings.merchantId])
    await Promise.all([
      dependencies.loadScript(`https://static.${friendbuyBaseHost}/friendbuy.js`),
      dependencies.loadScript(`https://campaign.${friendbuyBaseHost}/${settings.merchantId}/campaigns.js`)
    ])

    return friendbuyAPI
  },

  presets,
  actions: {
    trackCustomer,
    trackPurchase
  }
}

export default browserDestination(destination)
