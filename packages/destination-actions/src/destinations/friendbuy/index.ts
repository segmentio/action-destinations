import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackCustomer from './trackCustomer'
import trackPurchase from './trackPurchase'
import trackSignUp from './trackSignUp'

export const friendbuyBaseHost = 'fbot-sandbox.me'
export const trackUrl = `https://public.${friendbuyBaseHost}/track/`

const destination: DestinationDefinition<Settings> = {
  name: 'Friendbuy (Cloud Destination)',
  slug: 'friendbuy-cloud-dest',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      merchantId: {
        label: 'Friendbuy Merchant ID',
        description:
          'Find your Friendbuy Merchant ID by logging in to your [Friendbuy account](https://retailer.friendbuy.io/) and going to Developer Center > Friendbuy Code.',
        type: 'string',
        format: 'uuid',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Verify that the merchantId is valid.
      return request(`https://campaign.${friendbuyBaseHost}/${settings.merchantId}/campaigns.js`)
    }
  },

  onDelete: async (/*request, { settings, payload }*/) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    trackCustomer,
    trackPurchase,
    trackSignUp
  }
}

export default destination
