import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

import trackCustomer from './trackCustomer'

declare global {
  interface Window {
    friendbuyAPI?: any[]
    friendbuyBaseUrl?: string
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
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
    let friendbuyAPI
    window['friendbuyAPI'] = friendbuyAPI = window['friendbuyAPI'] || []
    const friendbuyBaseUrl = window.friendbuyBaseUrl ?? 'fbot.me'

    friendbuyAPI.merchantId = settings.merchantId
    friendbuyAPI.push(['merchant', settings.merchantId])
    await Promise.all([
      dependencies.loadScript(`https://static.${friendbuyBaseUrl}/friendbuy.js`),
      dependencies.loadScript(`https://campaign.${friendbuyBaseUrl}/${settings.merchantId}/campaigns.js`)
    ])

    return friendbuyAPI
  },

  actions: {
    trackCustomer
  }
}

export default browserDestination(destination)
