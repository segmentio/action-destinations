import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import updateUser from './updateUser'
import trackEvent from './trackEvent'
import updateCart from './updateCart'
import trackPurchase from './trackPurchase'
import { Region } from './shared-fields'
import { getRegionalEndpoint } from './utils'

const destination: DestinationDefinition<Settings> = {
  name: 'Iterable (Actions)',
  slug: 'actions-iterable',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description:
          "To obtain the API Key, go to the Iterable app and naviate to Integrations > API Keys. Create a new API Key with the 'Server-Side' type.",
        required: true
      },
      apiRegion: {
        label: 'Endpoint Region',
        description: 'The region to send your data.',
        type: 'string',
        format: 'text',
        choices: [
          {
            label: 'North America',
            value: 'north_america'
          },
          {
            label: 'Europe',
            value: 'europe'
          }
        ],
        default: 'north_america'
      }
    },
    testAuthentication: (request, { settings }) => {
      const endpoint = getRegionalEndpoint('getWebhooks', settings.apiRegion as Region)
      return request(endpoint, {
        method: 'get',
        headers: { 'Api-Key': settings.apiKey }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { 'Api-Key': settings.apiKey }
    }
  },
  actions: {
    updateUser,
    trackEvent,
    updateCart,
    trackPurchase
  },
  presets: [
    {
      name: 'Track Calls',
      subscribe: 'type = "track" and event != "Order Completed" and event != "Cart Updated"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    },
    {
      name: 'Identify Calls',
      subscribe: 'type = "identify"',
      partnerAction: 'updateUser',
      mapping: defaultValues(updateUser.fields)
    },
    {
      name: 'Update Cart Calls',
      subscribe: 'type = "track" and event = "Cart Updated"',
      partnerAction: 'updateCart',
      mapping: defaultValues(updateCart.fields)
    },
    {
      name: 'Order Completed Calls',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'trackPurchase',
      mapping: defaultValues(trackPurchase.fields)
    }
  ]
}

export default destination
