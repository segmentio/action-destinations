import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
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
    },



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

    product: {
      label: '',
      type: 'object',
      description: '',
      properties: {
        id: {
          label: 'Product Id',
          type: 'string',
          description: 'A globally unique identifier for the item.'
        },
        variantId: {
          label: 'Variant Id',
          type: 'string',
          description: 'Identifier for the variant of the product'
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
        },
        vendor: {
          label: 'Vendor',
          type: 'string',
          description: "The product's vendor name."
        },
        type: {
          label: 'Type',
          type: 'string',
          description: 'The product type specified by the merchant.'
        },
        url: {
          label: 'URL',
          type: 'string',
          description: 'The relative URL of the product.'
        }
      },
      default: {
        quantity: {
          '@path': '$.properties.quantity'
        },
        id: {
          '@path': '$.properties.product_id'
        },
        variantId: {
          '@path': '$.properties.variant'
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
        },
        vendor: {
          '@path': '$.properties.vendor'
        },
        type: {
          '@path': '$.properties.category'
        },
        url: {
          '@path': '$.properties.url'
        }
      }
    },

    cartLine: {
      ...product,
      label: 'Cart Line',
      description: 'Cart Line details',
      properties: {
        ...product.properties,
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Quantity of the item'
        }
      }
    },

    products: {
      label: '',
      type: 'object',
      multiple: true,
      description: '',
      properties: {
        id: {
          label: 'Product Id',
          type: 'string',
          description: 'A globally unique identifier for the item.'
        },
        variantId: {
          label: 'Variant Id',
          type: 'string',
          description: 'Identifier for the variant of the product'
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
        },
        vendor: {
          label: 'Vendor',
          type: 'string',
          description: "The product's vendor name."
        },
        type: {
          label: 'Type',
          type: 'string',
          description: 'The product type specified by the merchant.'
        },
        url: {
          label: 'URL',
          type: 'string',
          description: 'The relative URL of the product.'
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
            variantId: {
              '@path': '$.variant'
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
            },
            vendor: {
              '@path': '$.vendor'
            },
            type: {
              '@path': '$.category'
            },
            url: {
              '@path': '$.url'
            }
          }
        ]
      }
    },

    checkoutLineItems: {
      ...products,
      label: 'Checkout Line Items',
      description: 'Checkout Line Item details',
      properties: {
        ...products.properties, 
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Quantity of the item'
        },
        discountTitle: {
          label: 'Discount Title',
          type: 'string',
          description: 'The Discount Code applied to the item.'
        },
        discountValue: {
          label: 'Discount Value',
          type: 'number',
          description: 'The Discount value applied to the item.'
        }
      },
      default: {
        // ...products.default, 
        // quantity: {
        //   '@path': '$.quantity'
        // },
        // discountTitle: {
        //   '@path': '$.coupon'
        // },
        // discountValue: {
        //   '@path': '$.discount'
        // }
      }
    },

    cartLines: {
      ...products,
      label: 'Cart Line Items',
      description: 'Cart Line Item details',
      properties: {
        ...products.properties, 
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Quantity of the item'
        }
      },
      default: {
        // ...products.default, 
        // quantity: {
        //   '@path': '$.quantity'
        // }
      }
    },

    collectionProductVariants: {
      ...products,
      label: 'Collection Product Variants',
      description: 'A list of product variants associated with the collection.',
    },

    collection: {
      label: 'Collection',
      type: 'object',
      description: 'Collection details',
      additionalProperties: false,
      properties: {
        id: {
          label: 'Collection Id',
          type: 'string',
          description: 'A globally unique identifier for the collection.'
        },
        title: {
          label: 'Title',
          type: 'string',
          description: 'The collection title.'
        }
      },
      default: {
        id: {
          '@path': '$.properties.list_id'
        },
        title: {
          '@path': '$.properties.list_name'
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
    customAttributes: {
      label: 'Custom Attributes',
      type: 'object',
      description: 'Custom attributes for the event. Data should be specified as key:value pairs',
      additionalProperties: true,
      default: {
        '@path': '$.properties.custom_attributes'
      }
    },

    searchQuery: {
      type: 'string',
      label: 'Search Query',
      description: 'The search query that was executed.',
      default: {
        '@path': '$.properties.query'
      }
    },


    customer: {
      label: 'Customer',
      type: 'object',
      description: 'Customer details',
      properties: {
        email: {
          type: 'string',
          label: 'Email',
          description: "The customer's email address."
        },
        firstName: {
          type: 'string',
          label: 'First Name',
          description: "The customer's first name."
        },
        lastName: {
          type: 'string',
          label: 'Last Name',
          description: "The customer's last name."
        },
        phone: {
          type: 'string',
          label: 'Phone',
          description: 'The unique phone number (E.164 format) for this customer.'
        },
        dob: {
          type: 'string',
          label: 'Date of Birth',
          description: "The customer's date of birth."
        }
      },
      default: {
        email: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.context.traits.email' }
          }
        },
        firstName: {
          '@if': {
            exists: { '@path': '$.traits.first_name' },
            then: { '@path': '$.traits.first_name' },
            else: { '@path': '$.context.traits.first_name' }
          }
        },
        lastName: {
          '@if': {
            exists: { '@path': '$.traits.last_name' },
            then: { '@path': '$.traits.last_name' },
            else: { '@path': '$.context.traits.last_name' }
          } 
        },
        phone: {
          '@if': {
            exists: { '@path': '$.traits.phone' },
            then: { '@path': '$.traits.phone' },
            else: { '@path': '$.context.traits.phone' }
          }
        },
        dob: {
          '@if': {
            exists: { '@path': '$.traits.birthday' },
            then: { '@path': '$.traits.birthday' },
            else: { '@path': '$.context.traits.birthday' }
          }
        }
      }
    }




    form: {
      ...form,
      default: formDefault
    },
    formElements: {
      ...formElements,
      default: formElementsDefault
    },
   
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
