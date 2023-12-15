import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackPaymentOfflineConversion from './trackPaymentOfflineConversion'
import trackNonPaymentOfflineConversion from './trackNonPaymentOfflineConversion'
import { commonFields } from './common_fields'

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
  ...defaultValues(trackPaymentOfflineConversion.fields),
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
  ...defaultValues(trackPaymentOfflineConversion.fields),
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
  name: 'TikTok Offline Conversions',
  slug: 'actions-tiktok-offline-conversions',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Access Token',
        description:
          'Your TikTok Access Token. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?rid=mcxl4tclmfa&id=1758051319816193) for information on how to generate an access token via the TikTok Ads Manager or API.',
        type: 'string',
        required: true
      },
      eventSetID: {
        label: 'Event Set ID',
        type: 'string',
        description:
          'Your TikTok Offline Event Set ID. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?rid=mcxl4tclmfa&id=1758051319816193) for information on how to find this value.',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
        method: 'post',
        json: {}
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
      name: 'Page View',
      subscribe: 'type="page"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...multiProductContents,
        event: 'PageView'
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'event = "Product Viewed"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...singleProductContents,
        event: 'ViewContent'
      },
      type: 'automatic'
    },
    {
      name: 'Click Button',
      subscribe: 'event = "Product Clicked"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...singleProductContents,
        event: 'ClickButton'
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'event = "Products Searched"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...singleProductContents,
        event: 'Search'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'event = "Product Added to Wishlist"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...singleProductContents,
        event: 'AddToWishlist'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'event = "Product Added"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...singleProductContents,
        event: 'AddToCart'
      },
      type: 'automatic'
    },
    {
      name: 'Initiate Checkout',
      subscribe: 'event = "Checkout Started"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...multiProductContents,
        event: 'InitiateCheckout'
      },
      type: 'automatic'
    },
    {
      name: 'Add Payment Info',
      subscribe: 'event = "Payment Info Entered"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...multiProductContents,
        event: 'AddPaymentInfo'
      },
      type: 'automatic'
    },
    {
      name: 'Place an Order',
      subscribe: 'event = "Order Placed"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...multiProductContents,
        event: 'PlaceAnOrder'
      },
      type: 'automatic'
    },
    {
      name: 'Complete Payment',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...multiProductContents,
        event: 'CompletePayment'
      },
      type: 'automatic'
    },
    {
      name: 'Contact',
      subscribe: 'event = "Callback Started"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...defaultValues(commonFields),
        event: 'Contact'
      },
      type: 'automatic'
    },
    {
      name: 'Download',
      subscribe: 'event = "Download Link Clicked"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...defaultValues(commonFields),
        event: 'Download'
      },
      type: 'automatic'
    },
    {
      name: 'Submit Form',
      subscribe: 'event = "Form Submitted"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...defaultValues(commonFields),
        event: 'SubmitForm'
      },
      type: 'automatic'
    },
    {
      name: 'Complete Registration',
      subscribe: 'event = "Signed Up"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...defaultValues(commonFields),
        event: 'CompleteRegistration'
      },
      type: 'automatic'
    },
    {
      name: 'Subscribe',
      subscribe: 'event = "Subscription Created"',
      partnerAction: 'trackPaymentOfflineConversion',
      mapping: {
        ...defaultValues(commonFields),
        event: 'Subscribe'
      },
      type: 'automatic'
    }
  ],
  actions: {
    trackPaymentOfflineConversion,
    trackNonPaymentOfflineConversion
  }
}

export default destination
