import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import { cart, cartDefault } from './data-fields/cart'
import { cartLine, cartLineDefault } from './data-fields/cart-line'
import { cartLines, cartLinesDefault } from './data-fields/cart-lines'
import { checkout, checkoutDefault } from './data-fields/checkout'
import { checkoutAttributes, checkoutAttributesDefault } from './data-fields/checkout-attributes'
import {
  checkoutDiscountApplications,
  checkoutDiscountApplicationsDefault
} from './data-fields/checkout-discount-applications'
import { checkoutLineItems, checkoutLineItemsDefault } from './data-fields/checkout-line-items'
import { collection, collectionDefault } from './data-fields/collection'
import { collectionProductVariantDefault, collectionProductVariants } from './data-fields/collection-product-variants'
import { contacts, contactsDefault } from './data-fields/contacts'
import { customData, customDataDefault } from './data-fields/custom-data'
import { customer, customerDefault } from './data-fields/customer'
import { form, formDefault } from './data-fields/form'
import { formElements, formElementsDefault } from './data-fields/form-elements'
import { productVariant, productVariantDefault } from './data-fields/product-variant'
import {
  searchResultProductVariants,
  searchResultProductVariantsDefault
} from './data-fields/search-result-product-variants'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'

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
    cart: {
      ...cart,
      default: cartDefault
    },
    cartLines: {
      ...cartLines,
      default: cartLinesDefault
    },
    cartLine: {
      ...cartLine,
      default: cartLineDefault
    },
    checkout: {
      ...checkout,
      default: checkoutDefault
    },
    checkoutDiscountApplications: {
      ...checkoutDiscountApplications,
      default: checkoutDiscountApplicationsDefault
    },
    checkoutLineItems: {
      ...checkoutLineItems,
      default: checkoutLineItemsDefault
    },
    checkoutAttributes: {
      ...checkoutAttributes,
      default: checkoutAttributesDefault
    },
    collection: {
      ...collection,
      default: collectionDefault
    },
    collectionProductVariants: {
      ...collectionProductVariants,
      default: collectionProductVariantDefault
    },
    productVariant: {
      ...productVariant,
      default: productVariantDefault
    },
    searchQuery: {
      type: 'string',
      label: 'Search Query',
      description: 'The search query that was executed.',
      default: {
        '@path': '$.properties.searchResult.query'
      }
    },
    searchResultProductVariants: {
      ...searchResultProductVariants,
      default: searchResultProductVariantsDefault
    },
    customer: {
      ...customer,
      default: customerDefault
    },
    form: {
      ...form,
      default: formDefault
    },
    formElements: {
      ...formElements,
      default: formElementsDefault
    },
    contacts: {
      ...contacts,
      default: contactsDefault
    },
    customData: {
      ...customData,
      default: customDataDefault
    }
  },
  perform: (request, data) => {
    // we need to transform the payload to match the Angler API
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
