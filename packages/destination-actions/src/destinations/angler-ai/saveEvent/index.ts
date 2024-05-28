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
    identifiers: {
      label: 'Identifiers',
      type: 'object',
      description: 'Identifiers for the user',
      additionalProperties: true,
      properties: {
        userId: {
          label: 'Segment user ID',
          type: 'string',
          description: 'Segment User ID. Explain',
        }, 
        anonymousId: {
          label: 'Segment anonymous ID',
          type: 'string',
          description: 'Segment anonymous ID. Explain',
        }, 
        clientId: {
          label: 'Client ID',
          type: 'string',
          description: 'Client ID. Explain',
        }, 
        fbp: {
          label: 'Facebook Pixel ID',
          type: 'string',
          description: 'Facebook Pixel ID. TODO - explain that this is a cookie which is unique to each user.',
        }, 
        fbc: {
          label: 'Facebook Click ID',
          type: 'string',
          description: 'Facebook Click ID. TODO - explain '
        }, 
        ga: {
          label: 'Google Analytics ID',
          type: 'string',
          description: 'Google Analytics ID. TODO - explain'
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
          description: 'The URL where the event occurred.',
        },
        referrer: {
          label: 'Referrer',
          type: 'string',
          description: 'The referring URL if applicable.',
        },
      },
      additionalProperties: false,
      default: {
        url: { '@path': '$.context.page.url' },
        referrer: { '@path': '$.context.page.referrer' }
      }
    }



    event_name: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of your event',
      choices: [
        'cart_viewed', // cart fields + multi array of product details + order id + user profile details 
        'checkout_address_info_submitted', // cart fields + multi array of product details + order id + user profile details 
        'checkout_completed', // cart fields + multi array of product details + order id + user profile details 
        'checkout_contact_info_submitted', // cart fields +  array of product details + order id + user profile details 
        'checkout_shipping_info_submitted', // cart fields +  array of product details + order id + user profile details 
        'checkout_started', // cart fields +  array of product details + order id + user profile details 
        'payment_info_submitted', // cart fields + multi array of product details + order id + user profile details 

        'custom_event', //  cart fields + single product or array of product details + order id + user profile details 

        'collection_viewed', //  array of product details 
        'search_submitted', // query + array of product details 

        'page_viewed', // basic page detail fields + user profile details  + cart details 

        'product_added_to_cart', // single product detail fields 
        'product_removed_from_cart', // single product detail fields 
        'product_viewed', // single product detail fields 
        
        'form_submitted' // specific form fields 
      ]
    },
    custom_event_name: {
      label: 'Custom Event Name',
      type: 'string',
      description: "Additional name for custom events if 'event_name' is 'custom_event'."
    },
    cartLines: {
      label: 'Cart Lines',
      type: 'object',
      multiple: true,
      description: 'Cart item details',
      properties: {
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Quantity of the item'
        },
        id: {
          label: 'Merchandise Id',
          type: 'string',
          description: 'A globally unique identifier for the item.'
        },
        imageSrc: {
          label: 'Image Source URL',
          type: 'string',
          description: 'The location of the image as a URL.'
        },
        priceAmount: {
          label: 'Price Amount',
          type: 'number',
          description: 'The price of the product variant.'
        },
        sku: {
          label: 'SKU',
          type: 'string',
          description: 'The SKU (stock keeping unit) associated with the variant.'
        },
        title: {
          label: 'Title',
          type: 'string',
          description: "The product variant's title."
        },
        untranslatedTitle: {
          label: 'Untranslated Title',
          type: 'string',
          description: "The product variant's untranslated title."
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            quantity: {
              '@path': '$.quantity'
            },
            id: {
              '@path': '$.product_id'
            },
            imageSrc: {
              '@path': '$.image_url'
            },
            priceAmount: {
              '@path': '$.price'
            },
            sku: {
              '@path': '$.sku'
            },
            title: {
              '@path': '$.name'
            },
            untranslatedTitle: {
              '@path': '$.untranslated_name'
            }
          }
        ]
      }
    },
    cartLine: {
      label: 'Cart Line',
      type: 'object',
      description: 'Single cart item details',
      properties: {
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Quantity of the item'
        },
        id: {
          label: 'Merchandise Id',
          type: 'string',
          description: 'A globally unique identifier for the item.'
        },
        imageSrc: {
          label: 'Image Source URL',
          type: 'string',
          description: 'The location of the image as a URL.'
        },
        priceAmount: {
          label: 'Price Amount',
          type: 'number',
          description: 'The price of the product variant.'
        },
        sku: {
          label: 'SKU',
          type: 'string',
          description: 'The SKU (stock keeping unit) associated with the variant.'
        },
        title: {
          label: 'Title',
          type: 'string',
          description: "The product variant's title."
        },
        untranslatedTitle: {
          label: 'Untranslated Title',
          type: 'string',
          description: "The product variant's untranslated title."
        }
      },
      default: {
        quantity: {
          '@path': '$.properties.quantity'
        },
        id: {
          '@path': '$.properties.product_id'
        },
        imageSrc: {
          '@path': '$.properties.image_url'
        },
        priceAmount: {
          '@path': '$.properties.price'
        },
        sku: {
          '@path': '$.properties.sku'
        },
        title: {
          '@path': '$.properties.name'
        },
        untranslatedTitle: {
          '@path': '$.properties.untranslated_name'
        }
      }
    },
    cart_id: {
      label: 'Cart ID',
      type: 'string',
      description: 'A globally unique identifier for the cart.',
      default: {
        '@path': '$.properties.cart_id'
      }
    },
    totalAmount: {
      label: 'Total Amount',
      type: 'number',
      description: 'Decimal money amount.',
      default: {
        '@path': '$.properties.total'
      }
    },
    currencyCode: {
      label: 'Currency Code',
      type: 'string',
      description: 'The currency code of the money.',
      default: {
        '@path': '$.properties.currency'
      }
    },
    orderId: {
      label: 'Order ID',
      type: 'string',
      description: 'The ID of the order associated with this checkout.',
      default: {
        '@path': '$.properties.order_id'
      }
    },
    subtotalPriceAmount: {
      label: 'Subtotal Price Amount',
      type: 'number',
      description: 'A monetary value.',
      default: {
        '@path': '$.properties.subtotal'
      }
    },
    checkoutId: {
      label: 'Checkout ID',
      type: 'string',
      description: 'A unique identifier for a particular checkout.',
      default: {
        '@path': '$.properties.checkout_id'
      }
    },
    totalTaxAmount: {
      label: 'Total Tax Amount',
      type: 'number',
      description: 'A monetary value with currency.',
      default: {
        '@path': '$.properties.tax'
      }
    },
    shippingLinePriceAmount: {
      label: 'Shipping Line Price Amount',
      type: 'number',
      description: 'A monetary value.',
      default: {
        '@path': '$.properties.shipping'
      }
    },
    discount: {
      label: 'Discount',
      type: 'object',
      multiple: true,
      description: 'Discount details.',
      properties: {
        title: {
          label: 'Title',
          type: 'string',
          description:
            'The customer-facing name of the discount. If the type of discount is a DISCOUNT_CODE, this title attribute represents the code of the discount.'
        },
        type: {
          label: 'Type',
          type: 'string',
          description: 'The type of discount.'
        },
        amount: {
          label: 'Amount',
          type: 'number',
          description: 'Decimal money amount.'
        },
        percentage: {
          label: 'Percentage',
          type: 'number',
          description: 'The percentage value of the discount application.'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.discount',
          {
            title: {
              '@path': 'title'
            },
            amount: {
              '@path': 'amount'
            },
            percentage: {
              '@path': 'percentage'
            }
          }
        ]
      }
    }

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
