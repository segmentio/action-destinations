import type { ActionDefinition, InputField } from '@segment/actions-core'
import { cartFields } from '../fields/cartFields'
import { cartLineFields } from '../fields/cartLineFields'
import { checkoutFields } from '../fields/checkoutFields'
import { collectionFields } from '../fields/collectionFields'
import { commonFields } from '../fields/commonFields'
import { customerFields } from '../fields/customerFields'
import { formFields } from '../fields/formFields'
import { productVariantFields } from '../fields/productVariantFields'
import { searchFields } from '../fields/searchFields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'

function removeDefaults(fields: Record<string, InputField>) {
  return Object.entries(fields).reduce((acc, [key, field]) => {
    const { default: _, ...fieldWithoutDefault } = field
    return { ...acc, [key]: fieldWithoutDefault }
  }, {})
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Custom Event',
  description: 'Save a custom event that may have any fields.',
  fields: {
    ...removeDefaults(commonFields),
    ...removeDefaults(customerFields),
    ...removeDefaults(cartFields),
    ...removeDefaults(cartLineFields),
    ...removeDefaults(checkoutFields),
    ...removeDefaults(collectionFields),
    ...removeDefaults(formFields),
    ...removeDefaults(productVariantFields),
    ...removeDefaults(searchFields),
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
