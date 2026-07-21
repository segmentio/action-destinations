import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackCustomer from './trackCustomer'
import trackPurchase from './trackPurchase'
import trackSignUp from './trackSignUp'
import trackCustomEvent from './trackCustomEvent'
import { defaultMapiBaseUrl } from './cloudUtil'

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
        type: 'password',
        format: 'uuid',
        required: true
      },
      // For testing the Segment integration in a non-production environment,
      // prepend the environment name followed by a colon to the authSecret value.
      authSecret: {
        label: 'Friendbuy MAPI Secret',
        description: 'See Friendbuy MAPI Key.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Verify that the merchantId is valid.
      return request(`${defaultMapiBaseUrl}/v1/authorization`, {
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
      : request(`${defaultMapiBaseUrl}/v1/user-data`, {
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
