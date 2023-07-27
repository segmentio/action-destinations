import { defaultValues, DestinationDefinition, ErrorCodes, IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'
import { endpoints, sendRequest } from './util'

import identifyPlayer from './identifyPlayer'

import trackOrder from './trackOrder'

const destination: DestinationDefinition<Settings> = {
  name: 'gameball',
  slug: 'actions-gameball',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description:
          'Go to [help center](https://help.gameball.co/en/articles/3467114-get-your-account-integration-details-api-key-and-transaction-key) to learn how to find your API Key.',
        type: 'string',
        required: true
      },
      secretKey: {
        label: 'Secret Key',
        description:
          'Go to [help center](https://help.gameball.co/en/articles/3467114-get-your-account-integration-details-api-key-and-transaction-key) to learn how to find your API Key.',
        type: 'string',
        required: true,
      }
    },

    testAuthentication: async (request, { settings }) => {
      const endpoint = `${endpoints.baseAuthUrl}${endpoints.testAuthentication}`;
      const response = await sendRequest(request, endpoint, settings, {
        apiKey: settings.apiKey
      })

      // An empty post body will return a 400 response whereas a bad token will return a 401.
      if (response.status === 400) {
        throw new IntegrationError('Invalid Request', ErrorCodes.PAYLOAD_VALIDATION_FAILED, 400)
      } else if (response.status === 400) {
        throw new IntegrationError('Invalid API key', ErrorCodes.INVALID_AUTHENTICATION, 401)
      }
      return true
    }
  },

  presets: [{
    name: 'Track Events',
    subscribe: 'type = "track" and event != "Place Order"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields)
  },
  {
    name: 'Track Orders',
    subscribe: 'type = "track" and event = "Place Order"',
    partnerAction: 'trackOrder',
    mapping: defaultValues(trackOrder.fields)
  },
  {
    name: 'Create Players',
    subscribe: 'type = "identify"',
    partnerAction: 'identifyPlayer',
    mapping: defaultValues(identifyPlayer.fields)
  }],

  actions: {
    trackEvent,
    identifyPlayer,
    trackOrder
  }
}

export default destination
