import { defaultValues } from '@segment/actions-core'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import customEvent from './customEvent'
import upsertContact from './upsertContact'
import emailEvent from './emailEvent'
import { hosts } from './utils'

const singleProductFields = {
  ...defaultValues(customEvent.fields),
  products: {
    '@arrayPath': [
      '$.properties',
      {
        product_id: {
          '@path': '$.product_id'
        },
        qty: {
          '@path': '$.quantity'
        }
      }
    ]
  }
}

const destination: DestinationDefinition<Settings> = {
  name: 'Optimizely Data Platform',
  slug: 'actions-optimizely-data-platform',
  mode: 'cloud',
  description: 'Sync Segment analytics events and user profile data to Optimizely Data Platform',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'Api Key',
        description: 'Api Key used for Optimizely API authorization when sending events',
        type: 'password',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Optimizely Region to sync data to. Default is US',
        type: 'string',
        required: true,
        choices: [
          { label: 'US', value: 'US' },
          { label: 'Europe', value: 'EU' },
          { label: 'Australia', value: 'AU' }
        ],
        default: 'US'
      }
    },
    testAuthentication: (request, { settings }) => {
      const host = hosts[settings.region]

      return request(`${host}/auth`, {
        method: 'POST'
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { Authorization: `Bearer ${settings.apiKey}` }
    }
  },
  presets: [
    {
      name: 'Product Viewed',
      subscribe: 'type = "track" and event = "Product Viewed"',
      partnerAction: 'customEvent',
      mapping: {
        ...singleProductFields,
        event_action: 'product_viewed'
      },
      type: 'automatic'
    },
    {
      name: 'Product Added',
      subscribe: 'type = "track" and event = "Product Added"',
      partnerAction: 'customEvent',
      mapping: {
        ...singleProductFields,
        event_action: 'product_added_to_cart'
      },
      type: 'automatic'
    },
    {
      name: 'Product Removed',
      subscribe: 'type = "track" and event = "Product Removed"',
      partnerAction: 'customEvent',
      mapping: {
        ...singleProductFields,
        event_action: 'product_removed_from_cart'
      },
      type: 'automatic'
    },
    {
      name: 'Order Completed',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'customEvent',
      mapping: {
        ...defaultValues(customEvent.fields),
        event_action: 'purchase_completed'
      },
      type: 'automatic'
    },
    {
      name: 'Email Link Clicked',
      subscribe: 'type = "track" and event = "Email Link Clicked"',
      partnerAction: 'emailEvent',
      mapping: {
        ...defaultValues(emailEvent.fields),
        event_action: 'email_clicked'
      },
      type: 'automatic'
    },
    {
      name: 'Email Opened',
      subscribe: 'type = "track" and event = "Email Opened"',
      partnerAction: 'emailEvent',
      mapping: {
        ...defaultValues(emailEvent.fields),
        event_action: 'email_opened'
      },
      type: 'automatic'
    },
    {
      name: 'Unsubscribed',
      subscribe: 'type = "track" and event = "Unsubscribed"',
      partnerAction: 'emailEvent',
      mapping: {
        ...defaultValues(emailEvent.fields),
        event_action: 'email_unsubscribed'
      },
      type: 'automatic'
    },
    {
      name: 'Email Marked as Spam',
      subscribe: 'type = "track" and event = "Email Marked as Spam"',
      partnerAction: 'emailEvent',
      mapping: {
        ...defaultValues(emailEvent.fields),
        event_action: 'email_marked_as_spam'
      },
      type: 'automatic'
    }
  ],
  actions: {
    customEvent,
    upsertContact,
    emailEvent
  }
}

export default destination
