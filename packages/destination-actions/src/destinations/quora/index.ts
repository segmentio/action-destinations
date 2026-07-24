import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues, InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackConversion from './trackConversion'

const destination: DestinationDefinition<Settings> = {
  name: 'Quora Conversions API',
  slug: 'quora-actions',
  mode: 'cloud',
  description: 'Send Segment events to the Quora Conversions API.',

  authentication: {
    scheme: 'custom',
    fields: {
      api_token: {
        label: 'API Token',
        description:
          'The Conversion API token generated for your account in Quora Ads Manager. Sent as a Bearer token.',
        type: 'password',
        required: true
      },
      account_id: {
        label: 'Account ID',
        description: 'Your Quora ad account ID. Conversion data is attributed to this account.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (_request, { settings }) => {
      // Quora team will add a specific test endpoint in the future, but for now we can just check that the required fields are present and valid.
      if (!settings.api_token) {
        throw new InvalidAuthenticationError('Please provide an API Token.')
      }
      if (!settings.account_id || !/^\d+$/.test(settings.account_id.trim())) {
        throw new InvalidAuthenticationError('Please provide a valid numeric Account ID.')
      }
      return Promise.resolve(true)
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.api_token}`,
        'Content-Type': 'application/json'
      }
    }
  },

  presets: [
    {
      name: 'App Install',
      subscribe: 'type = "track" and event = "Application Installed"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        event_name: 'AppInstall',
        value: { '@path': '$.properties.value' }
      },
      type: 'automatic'
    },
    {
      name: 'Purchase',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'trackConversion',
      mapping: { ...defaultValues(trackConversion.fields), event_name: 'Purchase' },
      type: 'automatic'
    },
    {
      name: 'Complete Registration',
      subscribe: 'type = "track" and event = "Signed Up"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        event_name: 'CompleteRegistration',
        value: { '@path': '$.properties.value' }
      },
      type: 'automatic'
    },
    {
      name: 'Add Payment Info',
      subscribe: 'type = "track" and event = "Payment Info Entered"',
      partnerAction: 'trackConversion',
      mapping: { ...defaultValues(trackConversion.fields), event_name: 'AddPaymentInfo' },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'type = "track" and event = "Product Added"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        event_name: 'AddToCart',
        value: { '@path': '$.properties.price' }
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'type = "track" and event = "Product Added to Wishlist"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        event_name: 'AddToWishlist',
        value: { '@path': '$.properties.price' }
      },
      type: 'automatic'
    },
    {
      name: 'Initiate Checkout',
      subscribe: 'type = "track" and event = "Checkout Started"',
      partnerAction: 'trackConversion',
      mapping: { ...defaultValues(trackConversion.fields), event_name: 'InitiateCheckout' },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'type = "track" and event = "Products Searched"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        event_name: 'Search',
        value: { '@path': '$.properties.value' }
      },
      type: 'automatic'
    }
  ],

  actions: {
    trackConversion
  }
}

export default destination
