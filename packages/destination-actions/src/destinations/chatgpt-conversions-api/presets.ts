import { defaultValues } from '@segment/actions-core'
import type { Preset } from '@segment/actions-core'
import { fields } from './sendConversion/fields'
import { MULTI_PRODUCT_CONTENTS, SINGLE_PRODUCT_CONTENTS } from './constants'

const defaults = defaultValues(fields)

export const presets: Preset[] = [
  {
    name: 'ChatGPT Conversions API Browser Plugin',
    subscribe: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
    partnerAction: 'chatgptConversionsApiPlugin',
    mapping: {},
    type: 'automatic'
  },
  {
    name: 'App Installed',
    subscribe: 'type = "track" AND event = "Application Installed"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'app_installed',
      action_source: 'mobile_app'
    },
    type: 'automatic'
  },
  {
    name: 'App Opened',
    subscribe: 'type = "track" AND event = "Application Opened"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'app_opened',
      action_source: 'mobile_app'
    },
    type: 'automatic'
  },
  {
    name: 'Appointment Scheduled',
    subscribe: 'type = "track" AND event = "Appointment Scheduled"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'appointment_scheduled'
    },
    type: 'automatic'
  },
  {
    name: 'Checkout Started',
    subscribe: 'type = "track" AND event = "Checkout Started"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'checkout_started',
      amount: {
        '@if': {
          exists: { '@path': '$.properties.revenue' },
          then: { '@path': '$.properties.revenue' },
          else: { '@path': '$.properties.value' }
        }
      },
      contents: MULTI_PRODUCT_CONTENTS
    },
    type: 'automatic'
  },
  {
    name: 'Contents Viewed',
    subscribe: 'type = "track" AND event = "Product Viewed"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'contents_viewed',
      contents: SINGLE_PRODUCT_CONTENTS
    },
    type: 'automatic'
  },
  {
    name: 'Items Added',
    subscribe: 'type = "track" AND event = "Product Added"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'items_added',
      contents: SINGLE_PRODUCT_CONTENTS
    },
    type: 'automatic'
  },
  {
    name: 'Lead Created',
    subscribe: 'type = "track" AND event = "Lead Created"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'lead_created'
    },
    type: 'automatic'
  },
  {
    name: 'Order Created',
    subscribe: 'type = "track" AND event = "Order Completed"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'order_created',
      amount: {
        '@if': {
          exists: { '@path': '$.properties.revenue' },
          then: { '@path': '$.properties.revenue' },
          else: { '@path': '$.properties.total' }
        }
      },
      contents: MULTI_PRODUCT_CONTENTS
    },
    type: 'automatic'
  },
  {
    name: 'Page Viewed',
    subscribe: 'type = "page"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'page_viewed'
    },
    type: 'automatic'
  },
  {
    name: 'Registration Completed',
    subscribe: 'type = "track" AND event = "Signed Up"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'registration_completed'
    },
    type: 'automatic'
  },
  {
    name: 'Subscription Created',
    subscribe: 'type = "track" AND event = "Subscription Created"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'subscription_created',
      amount: { '@path': '$.properties.price' }
    },
    type: 'automatic'
  },
  {
    name: 'Trial Started',
    subscribe: 'type = "track" AND event = "Trial Started"',
    partnerAction: 'sendConversion',
    mapping: {
      ...defaults,
      event_type: 'trial_started'
    },
    type: 'automatic'
  }
]
