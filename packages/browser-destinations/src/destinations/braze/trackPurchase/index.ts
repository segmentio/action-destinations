import type appboy from '@braze/web-sdk'
import { omit } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, typeof appboy, Payload> = {
  title: 'Track Purchase',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  description: 'Reports that the current user made an in-app purchase.',
  platform: 'web',
  fields: {
    purchaseProperties: {
      label: 'Purchase Properties',
      type: 'object',
      description: `Hash of properties for this purchase. Keys are limited to 255 characters in length, cannot begin with a $, and can only contain alphanumeric characters and punctuation. Values can be numeric, boolean, Date objects, strings 255 characters or shorter, or nested objects whose values can be numeric, boolean, Date objects, arrays, strings, or null. Total size of purchase properties cannot exceed 50KB.`,
      default: {
        '@path': '$.properties'
      }
    },
    products: {
      label: 'Products',
      description: 'List of products purchased by the user',
      properties: {
        product_id: {
          label: 'Product ID',
          type: 'string',
          required: true,
          description: `A string identifier for the product purchased, e.g. an SKU. Value is limited to 255 characters in length, cannot begin with a $, and can only contain alphanumeric characters and punctuation.`
        },
        price: {
          label: 'Price',
          type: 'number',
          required: true,
          description: `The price paid. Base units depend on the currency. As an example, USD should be reported as Dollars.Cents, whereas JPY should be reported as a whole number of Yen. All provided values will be rounded to two digits with toFixed(2)`
        },
        currency: {
          label: 'Currency Code',
          type: 'string',
          description: `Default USD. Currencies should be represented as an ISO 4217 currency code`
        },
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: `Default 1. The quantity of items purchased expressed as a whole number. Must be at least 1 and at most 100.`
        }
      },
      type: 'object',
      multiple: true,
      default: {
        '@path': '$.properties.products'
      }
    }
  },
  perform: (client, data) => {
    const payload = data.payload

    const reservedKeys = Object.keys(action.fields.products.properties ?? {})
    const purchaseProperties = omit(payload.purchaseProperties, reservedKeys)

    if (purchaseProperties?.products && Array.isArray(purchaseProperties?.products)) {
      purchaseProperties?.products?.forEach((product) => {
        const result = client.logPurchase(
          (product.product_id as string | number).toString(),
          product.price,
          product.currency ?? 'USD',
          product.quantity ?? 1,
          purchaseProperties
        )

        if (!result) {
          console.warn('Braze failed to attach purchase to the session for product ', product.productId)
        }
      })
    }
  }
}

export default action
