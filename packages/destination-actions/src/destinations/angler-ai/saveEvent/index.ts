import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseURL, eventsEndpoint } from '../utils'
import { cartDefault, cart } from './data-fields/cart'
import { cartLineDefault, cartLine } from './data-fields/cart-line'
import { checkoutDefault, checkout } from './data-fields/checkout'
import { collectionDefault, collection } from './data-fields/collection'
import { productVariantDefault, productVariant } from './data-fields/product-variant'
import { searchResultDefault, searchResult } from './data-fields/search-result'
import { customerDefault, customer } from './data-fields/customer'
import { formDefault, form } from './data-fields/form'
import { contactsDefault, contacts } from './data-fields/contacts'
import { customDataDefault, customData } from './data-fields/custom-data'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Event',
  description: 'Send an event to Angler.',
  defaultSubscription: 'type = "track"',
  fields: {
    event_id: {
      label: 'Event ID',
      type: 'string',
      description: 'A unique event identifier.',
      default: {
        '@path': '$.messageId'
      }
    },
    event_name: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of your event',
      choices: [
        'cart_viewed',
        'checkout_address_info_submitted',
        'checkout_completed',
        'checkout_contact_info_submitted',
        'checkout_shipping_info_submitted',
        'checkout_started',
        'collection_viewed',
        'page_viewed',
        'payment_info_submitted',
        'product_added_to_cart',
        'product_removed_from_cart',
        'product_viewed',
        'search_submitted',
        'custom_event',
        'form_submitted'
      ]
    },
    custom_event_name: {
      label: 'Custom Event Name',
      type: 'string',
      description: "Additional name for custom events if 'event_name' is 'custom_event'."
    },
    ip_address: {
      label: 'IP Address',
      type: 'string',
      description: 'The IP address of the user.',
      default: {
        '@path': '$.context.ip'
      }
    },
    user_agent: {
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
    fbp: {
      label: 'Facebook Pixel ID',
      type: 'string',
      description: 'Facebook Pixel ID.',
      default: {
        '@path': '$.properties.fbp'
      }
    },
    fbc: {
      label: 'Facebook Click ID',
      type: 'string',
      description: 'Facebook Click ID.',
      default: {
        '@path': '$.properties.fbc'
      }
    },
    ga: {
      label: 'Google Analytics ID',
      type: 'string',
      description: 'Google Analytics ID.',
      default: {
        '@path': '$.properties.ga'
      }
    },
    identifiers: {
      label: 'Identifiers',
      type: 'object',
      multiple: true,
      description: 'Additional identifiers related to the event.',
      properties: {
        name: {
          type: 'string',
          label: 'Name',
          description: 'Name of the identifier.'
        },
        value: {
          type: 'string',
          label: 'Value',
          description: 'Value of the identifier.'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.identifiers',
          {
            name: { '@path': 'name' },
            value: { '@path': 'value' }
          }
        ]
      }
    },
    url: {
      label: 'URL',
      type: 'string',
      description: 'The URL where the event occurred.',
      default: {
        '@path': '$.context.page.url'
      }
    },
    client_id: {
      label: 'Client ID',
      type: 'string',
      description:
        'A unique client/browser identifier. ga or fbp cookie value will be used if this value is not provided.',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    referrer: {
      label: 'Referrer',
      type: 'string',
      description: 'The referring URL if applicable.',
      default: {
        '@path': '$.context.page.referrer'
      }
    },
    data: {
      label: 'Data',
      type: 'object',
      description: 'Structured data related to the event.',
      properties: {
        cart,
        cartLine,
        checkout,
        collection,
        productVariant,
        searchResult,
        customer,
        form,
        contacts,
        customData
      },
      default: {
        cart: cartDefault,
        cartLine: cartLineDefault,
        checkout: checkoutDefault,
        collection: collectionDefault,
        productVariant: productVariantDefault,
        searchResult: searchResultDefault,
        customer: customerDefault,
        form: formDefault,
        contacts: contactsDefault,
        customData: customDataDefault
      }
    }
  },
  perform: (request, data) => {
    const payload = {
      src: 'SEGMENT',
      data: [data.payload]
    }
    return request(baseURL + eventsEndpoint(data.settings.workspaceId), {
      method: 'post',
      json: payload
    })
  }
}

export default action
