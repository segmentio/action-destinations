import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import reportWebEvent from './reportWebEvent'

/** used in the quick setup */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Intiate Checkout',
    subscribe: 'event = "Checkout Started',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...defaultValues(reportWebEvent.fields),
      event: 'IntiateCheckout'
    }
  },
  {
    name: 'View Content',
    subscribe: 'type="page"',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...defaultValues(reportWebEvent.fields),
      event: 'ViewContent'
    }
  },
  {
    name: 'Products Searched',
    subscribe: 'event = "Products Searched',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...defaultValues(reportWebEvent.fields),
      event: 'Search'
    }
  },
  {
    name: 'Add Payment Info',
    subscribe: 'event = "Payment Info Entered',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...defaultValues(reportWebEvent.fields),
      event: 'AddPaymentInfo'
    }
  },
  {
    name: 'Order Completed',
    subscribe: 'event = "Order Completed',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...defaultValues(reportWebEvent.fields),
      event: 'PlaceOrder'
    }
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Actions Tiktok Conversions',
  slug: 'actions-tiktok-conversions',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Access Token',
        description:
          'Tiktok Long Term Access Token. You can generate this from the TikTok Marketing API portal. Please following Tiktoks Authorization guide for more info.',
        type: 'string',
        required: true
      },
      secretKey: {
        label: 'Secret Key',
        description: 'Tiktok app secret key. You can find this key in the "Basic Information" tab of your Tiktok app.',
        type: 'string',
        required: true
      },
      appId: {
        label: 'App Id',
        description: 'Tiktok app id. You can find this key in the "Basic Information" tab of your Tiktok app.',
        type: 'number',
        required: true
      },
      pixel_code: {
        label: 'Pixel Code',
        type: 'string',
        description: 'An ID for your Pixel. Required to send events to this pixel.',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      return request('https://business-api.tiktok.com/open_api/v1.2/oauth2/advertiser/get/', {
        json: {
          access_token: settings.accessToken,
          app_id: settings.appId,
          secret: settings.secretKey
        }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { 'Access-Token': settings.accessToken }
    }
  },
  presets,
  actions: {
    reportWebEvent
  }
}

export default destination
