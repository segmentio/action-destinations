import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import reportWebEvent from './reportWebEvent'
import { formatEvent } from './reportWebEvent/format'
import { sendEvent } from './client'

const presetEvents = [
  ['Order Completed', 'order_created'],
  ['Checkout Started', 'checkout_started'],
  ['Product Added', 'items_added'],
  ['Product Viewed', 'contents_viewed'],
  ['Lead Created', 'lead_created'],
  ['Signed Up', 'registration_completed'],
  ['Appointment Scheduled', 'appointment_scheduled'],
  ['Subscription Created', 'subscription_created'],
  ['Trial Started', 'trial_started']
]

const destination: DestinationDefinition<Settings> = {
  name: 'ChatGPT Ads Conversions',
  slug: 'chatgpt-ads-conversions',
  mode: 'cloud',
  description: 'Send website events from Segment to the ChatGPT Ads Conversions API.',
  authentication: {
    scheme: 'custom',
    fields: {
      pixel_id: {
        label: 'Pixel ID',
        description: 'The Pixel ID for your Ads Manager data source.',
        type: 'string',
        required: true
      },
      api_key: {
        label: 'Conversions API Key',
        description: 'A server-side CAPI key with access to this Pixel ID. Keep this key private.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request, { settings }) =>
      sendEvent(
        request,
        settings,
        formatEvent({
          event_id: 'segment-authentication-check',
          event_type: 'page_viewed',
          timestamp: new Date().toISOString(),
          source_url: 'https://example.com/segment-authentication-check'
        }),
        true
      )
  },
  presets: [
    ...presetEvents.map(([name, eventType]) => ({
      name,
      subscribe: `type = "track" and event = "${name}"`,
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event_type: eventType,
        ...(['Product Added', 'Product Viewed'].includes(name)
          ? {
              contents: {
                '@arrayPath': [
                  '$.properties',
                  {
                    id: { '@path': '$.product_id' },
                    name: { '@path': '$.name' },
                    quantity: { '@path': '$.quantity' },
                    amount: { '@path': '$.price' },
                    currency: { '@path': '$.currency' }
                  }
                ]
              }
            }
          : {})
      },
      type: 'automatic' as const
    })),
    {
      name: 'Page Viewed',
      subscribe: 'type = "page"',
      partnerAction: 'reportWebEvent',
      mapping: { ...defaultValues(reportWebEvent.fields), event_type: 'page_viewed' },
      type: 'automatic'
    }
  ],
  actions: { reportWebEvent }
}

export default destination
