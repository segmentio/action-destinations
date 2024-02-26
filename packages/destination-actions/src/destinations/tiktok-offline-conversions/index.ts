import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackPaymentOfflineConversion from './trackPaymentOfflineConversion'
import trackNonPaymentOfflineConversion from './trackNonPaymentOfflineConversion'
import reportOfflineEvent from './reportOfflineEvent'

const productProperties = {
  price: {
    '@path': '$.price'
  },
  quantity: {
    '@path': '$.quantity'
  },
  content_category: {
    '@path': '$.category'
  },
  content_id: {
    '@path': '$.product_id'
  },
  content_name: {
    '@path': '$.name'
  },
  brand: {
    '@path': '$.brand'
  }
}

const singleProductContents = {
  ...defaultValues(reportOfflineEvent.fields),
  contents: {
    '@arrayPath': [
      '$.properties',
      {
        ...productProperties
      }
    ]
  }
}

const multiProductContents = {
  ...defaultValues(reportOfflineEvent.fields),
  contents: {
    '@arrayPath': [
      '$.properties.products',
      {
        ...productProperties
      }
    ]
  }
}

const destination: DestinationDefinition<Settings> = {
  name: 'TikTok Offline Conversions Sandbox',
  slug: 'actions-tiktok-offline-conversions-sandbox',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Access Token',
        description:
          'Your TikTok Access Token. Please see TikTok’s [Events API 2.0 documentation](https://business-api.tiktok.com/portal/docs?id=1771101130925058) for information on how to generate an access token via the TikTok Ads Manager or API.',
        type: 'string',
        required: true
      },
      eventSetID: {
        label: 'Event Set ID',
        type: 'string',
        description:
          'Your TikTok Offline Event Set ID. Please see TikTok’s [Events API 2.0 documentation](https://business-api.tiktok.com/portal/docs?id=1771101027431425) for information on how to find this value.',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request('https://business-api.tiktok.com/open_api/v1.3/offline/track/', {
        method: 'post',
        json: {
          event_set_id: settings.eventSetID,
          event: 'Test Event',
          timestamp: '',
          context: {}
        }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'Access-Token': settings.accessToken,
        'Content-Type': 'application/json'
      }
    }
  },
  presets: [
    {
      name: 'Complete Payment',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...multiProductContents,
        event: 'CompletePayment'
      },
      type: 'automatic'
    },
    {
      name: 'Contact',
      subscribe: 'event = "Callback Started"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...defaultValues(reportOfflineEvent.fields),
        event: 'Contact'
      },
      type: 'automatic'
    },
    {
      name: 'Subscribe',
      subscribe: 'event = "Subscription Created"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...defaultValues(reportOfflineEvent.fields),
        event: 'Subscribe'
      },
      type: 'automatic'
    },
    {
      name: 'Submit Form',
      subscribe: 'event = "Form Submitted"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...defaultValues(reportOfflineEvent.fields),
        event: 'SubmitForm'
      },
      type: 'automatic'
    },
    {
      name: 'Page View',
      subscribe: 'type="page"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...multiProductContents,
        event: 'PageView'
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'event = "Product Viewed"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...singleProductContents,
        event: 'ViewContent'
      },
      type: 'automatic'
    },
    {
      name: 'Click Button',
      subscribe: 'event = "Product Clicked"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...singleProductContents,
        event: 'ClickButton'
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'event = "Products Searched"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...singleProductContents,
        event: 'Search'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'event = "Product Added to Wishlist"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...singleProductContents,
        event: 'AddToWishlist'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'event = "Product Added"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...singleProductContents,
        event: 'AddToCart'
      },
      type: 'automatic'
    },
    {
      name: 'Initiate Checkout',
      subscribe: 'event = "Checkout Started"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...multiProductContents,
        event: 'InitiateCheckout'
      },
      type: 'automatic'
    },
    {
      name: 'Add Payment Info',
      subscribe: 'event = "Payment Info Entered"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...multiProductContents,
        event: 'AddPaymentInfo'
      },
      type: 'automatic'
    },
    {
      name: 'Place an Order',
      subscribe: 'event = "Order Placed"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...multiProductContents,
        event: 'PlaceAnOrder'
      },
      type: 'automatic'
    },
    {
      name: 'Download',
      subscribe: 'event = "Download Link Clicked"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...defaultValues(reportOfflineEvent.fields),
        event: 'Download'
      },
      type: 'automatic'
    },
    {
      name: 'Complete Registration',
      subscribe: 'event = "Signed Up"',
      partnerAction: 'reportOfflineEvent',
      mapping: {
        ...defaultValues(reportOfflineEvent.fields),
        event: 'CompleteRegistration'
      },
      type: 'automatic'
    }
  ],
  actions: {
    trackPaymentOfflineConversion,
    trackNonPaymentOfflineConversion,
    reportOfflineEvent
  }
}

export default destination
