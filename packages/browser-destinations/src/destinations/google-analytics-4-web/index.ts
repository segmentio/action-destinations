import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import type { gtag } from './types'

import addPaymentInfo from './addPaymentInfo'

declare global {
  interface Window {
    dataLayer: any
    gtag: any

  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Google Analytics 4 Web',
  slug: 'actions-google-analytics-4-web',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
  },

  initialize: async ({ }, deps) => {
    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      window.dataLayer.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', 'G-FLGV21R2H6')
    window.gtag("event", "test_event_5")
    // window.gtag("event", "event_test4", {
    //   currency: "USD",
    //   value: 7.77,
    //   coupon: "SUMMER_FUN",
    //   payment_type: "Credit Card",
    //   items: [
    //     {
    //       item_id: "SKU_12345",
    //       item_name: "Stan and Friends Tee",
    //       affiliation: "Google Merchandise Store",
    //       coupon: "SUMMER_FUN",
    //       currency: "USD",
    //       discount: 2.22,
    //       index: 0,
    //       item_brand: "Google",
    //       item_category: "Apparel",
    //       item_category2: "Adult",
    //       item_category3: "Shirts",
    //       item_category4: "Crew",
    //       item_category5: "Short sleeve",
    //       item_list_id: "related_products",
    //       item_list_name: "Related Products",
    //       item_variant: "green",
    //       location_id: "ChIJIQBpAG2ahYAR_6128GcTUEo",
    //       price: 9.99,
    //       quantity: 1
    //     }
    //   ]
    // })
    const script = 'https://www.googletagmanager.com/gtag/js?id=G-58NFZSGQFD'
    deps.loadScript(script)
    console.log("loaded")
    window.gtag('set', 'G-FLGV21R2H6', {
      'user_properties': {
        'favorite_color': 'blue',
        'favorite_sport': 'soccer'
      }
    })
    return window.gtag
  },

  actions: {
    addPaymentInfo
  }
}

export default browserDestination(destination)
