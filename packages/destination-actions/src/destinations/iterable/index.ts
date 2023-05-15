import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import updateUser from './updateUser'
import trackEvent from './trackEvent'
import updateCart from './updateCart'
import trackPurchase from './trackPurchase'

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
        description: 'Iterable API key',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request('https://api.iterable.com/api/campaigns', {
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
      subscribe: 'type = "track" and event != "Order Completed" and event != "Update Cart"',
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
      subscribe: 'type = "track" and event = "Update Cart"',
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
