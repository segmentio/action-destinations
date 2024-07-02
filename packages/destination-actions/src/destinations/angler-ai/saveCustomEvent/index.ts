import type { ActionDefinition, InputField } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'

import { commonFields } from '../fields/commonFields'
import { cartFields } from '../fields/cartFields'
import { customerFields } from '../fields/customerFields'
import { commonFields } from '../fields/commonFields'
import { commonFields } from '../fields/commonFields'
import { commonFields } from '../fields/commonFields'
import { commonFields } from '../fields/commonFields'

function removeDefaults(fields: Record<string, InputField>) {
  return Object.entries(fields).reduce((acc, [key, field]) => {
    const { depends_on, ...fieldWithoutDefault } = field
    return { ...acc, [key]: fieldWithoutDefault }
  }, {})
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Custom Event',
  description: 'Save a custom event that may have any fields.',
  fields: {
    ...commonFields,
    ...cartFields,
    customerFields,
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

    // ...removeDefaults(saveCartEvent.fields),
    // ...removeDefaults(saveCheckoutEvent.fields),
    // ...removeDefaults(saveCollectionEvent.fields),
    // ...removeDefaults(saveFormEvent.fields),
    // ...removeDefaults(saveProductEvent.fields),
    // ...removeDefaults(saveSearchEvent.fields),
    // ...removeDefaults(saveBaseEvent.fields)
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
