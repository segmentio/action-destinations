import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackCustomer from './trackCustomer'
import trackPurchase from './trackPurchase'
import trackSignUp from './trackSignUp'
import trackCustomEvent from './trackCustomEvent'
import { mapiUrl } from './cloudUtil'

const destination: DestinationDefinition<Settings> = {
  name: 'Friendbuy (Cloud Destination)',
  slug: 'actions-friendbuy-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      authKey: {
        label: 'Friendbuy MAPI Key',
        description: 'Contact your Friendbuy account manager to generate your Friendbuy MAPI key and secret.',
        type: 'string',
        format: 'uuid',
        required: true
      },
      authSecret: {
        label: 'Friendbuy MAPI Secret',
        description: 'See Friendbuy MAPI Key.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Verify that the merchantId is valid.
      return request(`${mapiUrl}/v1/authorization`, {
        method: 'POST',
        json: { key: settings.authKey, secret: settings.authSecret }
      })
    }
  },

  onDelete: async (request, { payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
    return !payload.userId
      ? true
      : request(`${mapiUrl}/v1/user-data`, {
        method: 'DELETE',
        searchParams: {
          customerId: payload.userId
        }
      })
  },

  actions: {
    trackCustomer,
    trackPurchase,
    trackSignUp,
    trackCustomEvent
  }
}

export default destination
