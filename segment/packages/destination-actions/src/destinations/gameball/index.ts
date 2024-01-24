import { defaultValues, DestinationDefinition } from '@segment/actions-core'
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
        type: 'password',
        required: true
      },
      secretKey: {
        label: 'Secret Key',
        description:
          'Go to [help center](https://help.gameball.co/en/articles/3467114-get-your-account-integration-details-api-key-and-transaction-key) to learn how to find your API Key.',
        type: 'password',
        required: true
      }
    },

    testAuthentication: (request, { settings }) => {
      const endpoint = `${endpoints.baseAuthUrl}${endpoints.testAuthentication}`
      return sendRequest(request, endpoint, settings, {
        apiKey: settings.apiKey,
        secretKey: settings.secretKey
      })
    }
  },

  presets: [
    {
      name: 'Track Events',
      subscribe: 'type = "track" and event != "Order Completed"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Track Orders',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'trackOrder',
      mapping: defaultValues(trackOrder.fields),
      type: 'automatic'
    },
    {
      name: 'Create Or Update Players',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyPlayer',
      mapping: defaultValues(identifyPlayer.fields),
      type: 'automatic'
    }
  ],

  actions: {
    trackEvent,
    identifyPlayer,
    trackOrder
  }
}

export default destination
