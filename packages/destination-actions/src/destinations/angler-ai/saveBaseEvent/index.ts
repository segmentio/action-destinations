import type { ActionDefinition } from '@segment/actions-core'
import { cart, customer } from '../fields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import { transformPayload } from './transform-payload'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Base Event',
  description: 'Send a base event that has the basic fields applicable to all events.',
  fields: {
    eventId: {
      label: 'Event ID',
      type: 'string',
      description: 'A unique event identifier.',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    eventName: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the event to track.',
      required: true,
      choices: [
        { label: 'page_viewed', value: 'page_viewed' },
        { label: 'cart_viewed', value: 'cart_viewed' },
        { label: 'checkout_address_info_submitted', value: 'checkout_address_info_submitted' },
        { label: 'checkout_completed', value: 'checkout_completed' },
        { label: 'checkout_contact_info_submitted', value: 'checkout_contact_info_submitted' },
        { label: 'checkout_shipping_info_submitted', value: 'checkout_shipping_info_submitted' },
        { label: 'checkout_started', value: 'checkout_started' },
        { label: 'collection_viewed', value: 'collection_viewed' },
        { label: 'payment_info_submitted', value: 'payment_info_submitted' },
        { label: 'product_added_to_cart', value: 'product_added_to_cart' },
        { label: 'product_removed_from_cart', value: 'product_removed_from_cart' },
        { label: 'product_viewed', value: 'product_viewed' },
        { label: 'search_submitted', value: 'search_submitted' },
        { label: 'form_submitted', value: 'form_submitted' },
        { label: 'custom_event', value: 'custom_event' }
      ]
    },
    customEventName: {
      label: 'Custom Event Name',
      type: 'string',
      description: "Additional name for custom events if 'event_name' is 'custom_event'.",
      depends_on: {
        conditions: [
          {
            fieldKey: 'eventName',
            value: 'custom_event',
            operator: 'is'
          }
        ]
      }
    },
    ipAddress: {
      label: 'IP Address',
      type: 'string',
      description: 'The IP address of the user.',
      default: {
        '@path': '$.context.ip'
      }
    },
    userAgent: {
      label: 'User Agent',
      type: 'string',
      description: 'The user agent of the device sending the event.',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    timestamp: {
      label: 'Timestamp',
      type: 'string',
      description: 'The timestamp when the event was triggered.',
      default: {
        '@path': '$.timestamp'
      }
    },
    identifiers: {
      label: 'Identifiers',
      type: 'object',
      description: 'Identifiers for the user',
      required: true,
      additionalProperties: true,
      properties: {
        userId: {
          label: 'Segment user ID',
          type: 'string',
          description: 'Segment User ID.'
        },
        anonymousId: {
          label: 'Segment anonymous ID',
          type: 'string',
          description: 'Segment anonymous ID.'
        },
        clientId: {
          label: 'Client ID',
          type: 'string',
          description: 'Client ID.',
          required: true
        },
        fbp: {
          label: 'Facebook Pixel ID',
          type: 'string',
          description: 'Facebook Pixel ID. This is a cookie which is unique to each user.'
        },
        fbc: {
          label: 'Facebook Click ID',
          type: 'string',
          description: 'Facebook Click ID. This is a cookie which is unique to each user.'
        },
        ga: {
          label: 'Google Analytics ID',
          type: 'string',
          description: 'Google Analytics ID. This is a cookie which is unique to each user.'
        }
      },
      default: {
        userId: { '@path': '$.userId' },
        anonymousId: { '@path': '$.anonymousId' },
        clientId: { '@path': '$.anonymousId' },
        fbp: { '@path': '$.properties.fbp' },
        fbc: { '@path': '$.properties.fbc' },
        ga: { '@path': '$.properties.ga' }
      }
    },
    page: {
      label: 'Page',
      type: 'object',
      description: 'Page details to send with the event',
      properties: {
        url: {
          label: 'URL',
          type: 'string',
          description: 'The URL where the event occurred.'
        },
        referrer: {
          label: 'Referrer',
          type: 'string',
          description: 'The referring URL if applicable.'
        }
      },
      additionalProperties: false,
      default: {
        url: { '@path': '$.context.page.url' },
        referrer: { '@path': '$.context.page.referrer' }
      }
    },
    ...cart,
    customer,
    customAttributes: {
      label: 'Custom Attributes',
      type: 'object',
      description: 'Custom attributes for the event. Data should be specified as key:value pairs',
      additionalProperties: true
    }
  },
  perform: (request, data) => {
    const transformedPayload = transformPayload(data.payload)

    const payload = {
      src: 'SEGMENT',
      data: [transformedPayload]
    }
    return request(baseURL + eventsEndpoint(data.settings.workspaceId), {
      method: 'post',
      json: payload
    })
  }
}

export default action
