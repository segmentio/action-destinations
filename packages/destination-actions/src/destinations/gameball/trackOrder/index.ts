import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { endpoints, playerProperties, sendRequest } from '../util'
import type { Payload } from './generated-types'

const mapPayload = (payload: Payload) => {
  const object = { ...payload } as any
  delete object.branch
  if (payload.merchantId && payload.merchantName) {
    object.merchant = {
      uniqueId: payload.merchantId,
      name: payload.merchantName
    }

    if (payload.branchId && payload.branchName) {
      object.merchant.branch = {
        uniqueId: payload.branchId,
        name: payload.branchName
      }
    }
  }

  return object
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Order',
  description: 'This action used to track orders. They are designed specifically for E-Commerce Solutions.',
  defaultSubscription: 'event = "Order Completed"',
  fields: {
    ...playerProperties,
    orderId: {
      label: 'Order Id',
      description:
        'Unique order ID which identifies the underlying order in your system, e.g. order number, invoice number. It will be used for reversing any reward or redemption transaction on Gameball.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.order_id'
      }
    },
    orderDate: {
      label: 'Order Date',
      description: 'The date this order was placed, as an ISO8601 timestamp. Defaults to now if not provided.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    totalPrice: {
      label: 'Total Price',
      description: `The sum of all order items' prices, including discounts, shipping, taxes, and tips. (Note: totalPaid is part of the totalPrice). Must be positive.`,
      required: true,
      type: 'number',
      default: {
        '@path': '$.properties.total'
      }
    },
    totalPaid: {
      label: 'Total Paid',
      description:
        'The actual paid amount to the store. (Based on this amount, the player will be rewarded. Also, According to the Cashback Configuration). Must be positive.',
      type: 'number',
      required: true,
      default: {
        '@path': '$.properties.subtotal'
      }
    },
    totalShipping: {
      label: 'Total Shipping',
      description: 'The total shipping price of the order. Must be positive.',
      type: 'number',
      default: {
        '@path': '$.properties.shipping'
      }
    },
    totalTax: {
      label: 'Total Tax',
      description: 'The sum of all the taxes applied to the order in the shop currency. Must be positive.',
      type: 'number',
      default: {
        '@path': '$.properties.tax'
      }
    },
    totalDiscount: {
      label: 'Total Discount',
      description: 'Total discount applied on this order. Must be positive.',
      type: 'number',
      default: {
        '@path': '$.properties.discount'
      }
    },
    lineItems: {
      label: 'Line Items',
      description: 'A list of line items, each containing information about an item in the order.',
      type: 'object',
      multiple: true,
      properties: {
        productId: {
          label: 'Product Id',
          type: 'string',
          description: 'The ID of the product that the line item belongs to'
        },
        sku: {
          label: 'SKU',
          type: 'string',
          description: `The item's SKU (stock keeping unit).`
        },
        title: {
          label: 'Title',
          type: 'string',
          description: 'The title of the product.'
        },
        category: {
          label: 'Category',
          type: 'string',
          multiple: true,
          description: 'Product category (fashion, electronics.. etc). It can be one category or multiple categories.'
        },
        collection: {
          label: 'Collection',
          type: 'string',
          multiple: true,
          description:
            'Collection ID(s) to which the product belongs. It can be one collection or multiple collections. This will be also based on the available collections in your store.'
        },
        tags: {
          label: 'Tags',
          type: 'string',
          multiple: true,
          description: 'Tag(s) attached to the item in the order.'
        },
        weight: {
          label: 'Weight',
          type: 'number',
          description: 'Item weight. Must be positive.'
        },
        vendor: {
          label: 'Vendor',
          type: 'string',
          description: `The name of the item's supplier.`
        },
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Number of items purchased of this line item. Must be positive.'
        },
        price: {
          label: 'Price',
          type: 'number',
          required: true,
          description:
            'The original price of the product before adding tax or discount. Note that: it should reflect the price of a single product ignoring quantity'
        },
        taxes: {
          label: 'Taxes',
          type: 'number',
          required: true,
          description:
            'The sum of all the taxes applied to the line item in the shop currency. Must be positive. Note that: It should reflect total taxes for line item considering quantity'
        },
        discount: {
          label: 'Discount',
          type: 'number',
          required: true,
          description:
            'Total discount applied on this line item. Must be positive. Note that: This value should reflect total discounts for line item considering quantity'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            productId: {
              '@path': 'product_id'
            },
            sku: {
              '@path': 'sku'
            },
            title: {
              '@path': 'title'
            },
            category: {
              '@path': 'category'
            },
            collection: {
              '@path': 'collection'
            },
            tags: {
              '@path': 'tags'
            },
            weight: {
              '@path': 'weight'
            },
            vendor: {
              '@path': 'vendor'
            },
            quantity: {
              '@path': 'quantity'
            },
            price: {
              '@path': 'price'
            },
            taxes: {
              '@path': 'taxes'
            },
            discount: {
              '@path': 'discount'
            }
          }
        ]
      }
    },
    discountCodes: {
      label: 'Discount Codes',
      description: 'An array of discount codes.',
      type: 'string',
      multiple: true,
      default: {
        '@path': '$.properties.coupon'
      }
    },
    redeemedAmount: {
      label: 'Redeemed Amount',
      description:
        'Monetary value of the redeemed points to be used by that player while placing his order. Note:  If this field is set, then the holdReference value should be null. Also, both fields could be null.',
      type: 'number',
      default: {
        '@path': '$.properties.redeemedAmount'
      }
    },
    holdReference: {
      label: 'Hold Reference',
      description:
        'Hold reference ID received after calling Hold Points API. This is used in case you want to use already held points. Note:  If this field is set, then the redeemedAmount value should be null. Also, both fields could be null.',
      type: 'string',
      default: {
        '@path': '$.properties.holdReference'
      }
    },
    guest: {
      label: 'Guest',
      description: 'A boolean value indicating if the customer who placed this order is a guest. The default is false.',
      type: 'boolean',
      default: {
        '@if': {
          exists: { '@path': '$.properties.is_guest' },
          then: { '@path': '$.properties.is_guest' },
          else: false
        }
      }
    },
    extra: {
      label: 'Extra',
      description:
        'Key value pair(s) of any extra information about the order. The key values must be of type string or number',
      type: 'object',
      additionalProperties: true,
      default: {
        '@path': '$.properties.extra'
      }
    },
    merchantId: {
      label: 'Merchant Id',
      type: 'string',
      description: 'Merchant unique id or code',
      default: { '@path': '$.properties.merchantId' }
    },
    merchantName: {
      label: 'Merchant Name',
      type: 'string',
      description: 'Merchant name',
      default: { '@path': '$.properties.merchantName' }
    },
    branchId: {
      label: 'Branch Id',
      type: 'string',
      description: 'Branch unique id or code',
      default: { '@path': '$.properties.branchId' }
    },
    branchName: {
      label: 'Branch Name',
      type: 'string',
      description: 'Branch name',
      default: { '@path': '$.properties.branchName' }
    }
  },

  perform: (request, { payload, settings }) => {
    const endpoint = `${endpoints.baseApiUrl}${endpoints.trackOrder}`
    return sendRequest(request, endpoint, settings, mapPayload(payload), true)
  }
}

export default action
