import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import reportWebEvent from './reportWebEvent'
import { defaultValues } from '@segment/actions-core'
import { TikTokPixel } from './types'
import { initScript } from './init-script'

import identify from './identify'

declare global {
  interface Window {
    ttq: TikTokPixel
  }
}

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
  ...defaultValues(reportWebEvent.fields),
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
  ...defaultValues(reportWebEvent.fields),
  contents: {
    '@arrayPath': [
      '$.properties.products',
      {
        ...productProperties
      }
    ]
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, TikTokPixel> = {
  name: 'TikTok Pixel',
  slug: 'actions-tiktok-pixel',
  mode: 'device',
  presets: [
    {
      name: 'Complete Payment',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...multiProductContents,
        event: 'CompletePayment'
      },
      type: 'automatic'
    },
    {
      name: 'Contact',
      subscribe: 'event = "Callback Started"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event: 'Contact'
      },
      type: 'automatic'
    },
    {
      name: 'Subscribe',
      subscribe: 'event = "Subscription Created"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event: 'Subscribe'
      },
      type: 'automatic'
    },
    {
      name: 'Submit Form',
      subscribe: 'event = "Form Submitted"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event: 'SubmitForm'
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'event = "Product Viewed"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'ViewContent'
      },
      type: 'automatic'
    },
    {
      name: 'Click Button',
      subscribe: 'event = "Product Clicked"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'ClickButton'
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'event = "Products Searched"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'Search'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'event = "Product Added to Wishlist"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'AddToWishlist'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'event = "Product Added"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'AddToCart'
      },
      type: 'automatic'
    },
    {
      name: 'Initiate Checkout',
      subscribe: 'event = "Checkout Started"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...multiProductContents,
        event: 'InitiateCheckout'
      },
      type: 'automatic'
    },
    {
      name: 'Add Payment Info',
      subscribe: 'event = "Payment Info Entered"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...multiProductContents,
        event: 'AddPaymentInfo'
      },
      type: 'automatic'
    },
    {
      name: 'Place an Order',
      subscribe: 'event = "Order Placed"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...multiProductContents,
        event: 'PlaceAnOrder'
      },
      type: 'automatic'
    },
    {
      name: 'Download',
      subscribe: 'event = "Download Link Clicked"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event: 'Download'
      },
      type: 'automatic'
    },
    {
      name: 'Complete Registration',
      subscribe: 'event = "Signed Up"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event: 'CompleteRegistration'
      },
      type: 'automatic'
    }
  ],
  settings: {
    pixelCode: {
      label: 'Pixel Code',
      type: 'string',
      description:
        "Your TikTok Pixel ID. Please see TikTok's [Pixel documentation](https://ads.tiktok.com/marketing_api/docs?id=1739583652957185) for information on how to find this value.",
      required: true
    },
    ldu: {
      label: 'Limited Data Use',
      type: 'boolean',
      description:
        'In order to help facilitate advertiser\'s compliance with the right to opt-out of sale and sharing of personal data under certain U.S. state privacy laws, TikTok offers a Limited Data Use ("LDU") feature. For more information, please refer to TikTok\'s [documentation page](https://business-api.tiktok.com/portal/docs?id=1770092377990145).'
    },
    useExistingPixel: {
      // TODO: HOW TO DELETE (reusing will not include Segment Partner name)
      label: '[Deprecated] Use Existing Pixel',
      type: 'boolean',
      default: false,
      required: false,
      description: 'Deprecated. Please do not provide any value.'
    }
  },
  initialize: async ({ settings }, deps) => {
    if (!settings.useExistingPixel) {
      initScript(settings)
    }
    await deps.resolveWhen(() => window.ttq != null, 100)
    return window.ttq
  },
  actions: {
    reportWebEvent,
    identify
  }
}

export default browserDestination(destination)
