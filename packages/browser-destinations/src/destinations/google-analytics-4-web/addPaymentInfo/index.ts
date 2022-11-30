import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Add Payment Info',
  description: '',
  platform: 'web',
  fields: {},
  perform: (gtag, event) => {
    console.log("reached")
    gtag("event", "event_test4", {
      currency: "USD",
      value: 7.77,
      coupon: "SUMMER_FUN",
      payment_type: "Credit Card",
      items: [
        {
          item_id: "SKU_12345",
          item_name: "Stan and Friends Tee",
          affiliation: "Google Merchandise Store",
          coupon: "SUMMER_FUN",
          currency: "USD",
          discount: 2.22,
          index: 0,
          item_brand: "Google",
          item_category: "Apparel",
          item_category2: "Adult",
          item_category3: "Shirts",
          item_category4: "Crew",
          item_category5: "Short sleeve",
          item_list_id: "related_products",
          item_list_name: "Related Products",
          item_variant: "green",
          location_id: "ChIJIQBpAG2ahYAR_6128GcTUEo",
          price: 9.99,
          quantity: 1
        }
      ]
    })
    // Invoke Partner SDK here
  }
}

export default action
