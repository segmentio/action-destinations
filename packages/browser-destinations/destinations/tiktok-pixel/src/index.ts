import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import reportWebEvent from './reportWebEvent'
import { defaultValues } from '@segment/actions-core'
import { TikTokPixel } from './types'
import { initScript } from './init-script'

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
  content_type: {
    '@path': '$.category'
  },
  content_id: {
    '@path': '$.product_id'
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
      name: 'View Content',
      subscribe: 'type="page"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'ViewContent'
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
      subscribe: 'event = "Order Completed"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...multiProductContents,
        event: 'PlaceAnOrder'
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
    useExistingPixel: {
      label: 'Use Existing Pixel',
      type: 'boolean',
      description: 'Select "true" to use existing Pixel that is already installed on your website.'
    }
  },
  initialize: async ({ settings }, deps) => {
    if (!settings.useExistingPixel) {
      initScript(settings.pixelCode)
    }
    await deps.resolveWhen(() => window.ttq != null, 100)
    return window.ttq
  },
  actions: {
    reportWebEvent
  }
}

export default browserDestination(destination)
