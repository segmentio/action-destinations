import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { defaultValues, DestinationDefinition } from '@segment/actions-core'

import trackCustomer from './trackCustomer'

import trackPurchase from './trackPurchase'

export interface FriendbuyAPI extends Array<any> {
  merchantId: string
}

declare global {
  interface Window {
    friendbuyAPI?: FriendbuyAPI
    friendbuyBaseHost?: string
  }
}

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Customer',
    subscribe: 'type = "identify"',
    partnerAction: 'trackCustomer',
    mapping: defaultValues(trackCustomer.fields)
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
