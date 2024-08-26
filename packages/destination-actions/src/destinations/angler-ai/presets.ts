import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import saveBaseEvent from './saveBaseEvent'
import saveCartEvent from './saveCartEvent'
import saveCheckoutEvent from './saveCheckoutEvent'
import saveCollectionEvent from './saveCollectionEvent'
import saveFormEvent from './saveFormEvent'
import saveOrder from './saveOrder'
import saveProductEvent from './saveProductEvent'
import saveSearchEvent from './saveSearchEvent'
import saveUser from './saveUser'

export const presets: DestinationDefinition['presets'] = [
  {
    name: 'Save User',
    subscribe: 'type = "identify"',
    partnerAction: 'saveUser',
    mapping: defaultValues(saveUser.fields),
    type: 'automatic'
  },
  {
    name: 'Save Event - Page Viewed',
    subscribe: 'type = "page"',
    partnerAction: 'saveBaseEvent',
    mapping: {
      ...defaultValues(saveBaseEvent.fields),
      eventName: { '@template': 'page_viewed' }
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Cart Viewed',
    subscribe: 'event = "Cart Viewed"',
    partnerAction: 'saveBaseEvent',
    mapping: {
      ...defaultValues(saveBaseEvent.fields),
      eventName: { '@template': 'cart_viewed' }
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Checkout Address Info Submitted',
    subscribe: 'event = "Checkout Address Info Submitted"',
    partnerAction: 'saveCheckoutEvent',
    mapping: {
      ...defaultValues(saveCheckoutEvent.fields),
      eventName: 'checkout_address_info_submitted'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Checkout Completed',
    subscribe: 'event = "Order Completed"',
    partnerAction: 'saveCheckoutEvent',
    mapping: {
      ...defaultValues(saveCheckoutEvent.fields),
      eventName: 'checkout_completed'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Checkout Contact Info Submitted',
    subscribe: 'event = "Checkout Contact Info Submitted"',
    partnerAction: 'saveCheckoutEvent',
    mapping: {
      ...defaultValues(saveCheckoutEvent.fields),
      eventName: 'checkout_contact_info_submitted'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Checkout Shipping Info Submitted',
    subscribe: 'event = "Checkout Shipping Info Submitted"',
    partnerAction: 'saveCheckoutEvent',
    mapping: {
      ...defaultValues(saveCheckoutEvent.fields),
      eventName: 'checkout_shipping_info_submitted'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Checkout Started',
    subscribe: 'event = "Checkout Started"',
    partnerAction: 'saveCheckoutEvent',
    mapping: {
      ...defaultValues(saveCheckoutEvent.fields),
      eventName: 'checkout_started'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Checkout Payment Info Submitted',
    subscribe: 'event = "Payment Info Entered"',
    partnerAction: 'saveCheckoutEvent',
    mapping: {
      ...defaultValues(saveCheckoutEvent.fields),
      eventName: 'checkout_payment_info_submitted'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Collection Viewed',
    subscribe: 'event = "Product List Viewed"',
    partnerAction: 'saveCollectionEvent',
    mapping: {
      ...defaultValues(saveCollectionEvent.fields),
      eventName: 'collection_viewed'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Search Submitted',
    subscribe: 'event = "Products Searched"',
    partnerAction: 'saveSearchEvent',
    mapping: {
      ...defaultValues(saveSearchEvent.fields),
      eventName: 'search_submitted'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Product Added To Cart',
    subscribe: 'event = "Product Added"',
    partnerAction: 'saveCartEvent',
    mapping: {
      ...defaultValues(saveCartEvent.fields),
      eventName: 'product_added_to_cart'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Product Removed From Cart',
    subscribe: 'event = "Product Removed"',
    partnerAction: 'saveCartEvent',
    mapping: {
      ...defaultValues(saveCartEvent.fields),
      eventName: 'product_removed_from_cart'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Product Viewed',
    subscribe: 'event = "Product Viewed"',
    partnerAction: 'saveProductEvent',
    mapping: {
      ...defaultValues(saveProductEvent.fields),
      eventName: 'product_viewed'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Form Submitted',
    subscribe: 'event = "Form Submitted"',
    partnerAction: 'saveFormEvent',
    mapping: {
      ...defaultValues(saveFormEvent.fields),
      eventName: 'form_submitted'
    },
    type: 'automatic'
  },
  {
    name: 'Save Order',
    subscribe: 'event = "Order Completed"',
    partnerAction: 'saveOrder',
    mapping: defaultValues(saveOrder.fields),
    type: 'automatic'
  }
]
