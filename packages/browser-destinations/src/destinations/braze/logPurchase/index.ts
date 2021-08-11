import type appboy from '@braze/web-sdk'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, typeof appboy, Payload> = {
  title: 'Log Purchase',
  description: 'Reports that the current user made an in-app purchase.',
  platform: 'web',
  fields: {
    userId: {
      label: 'User ID',
      description: "The current user's ID",
      type: 'string'
    },
    products: {
      label: 'Products',
      description: 'List of products purchased by the user',
      properties: {
        productId: {
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
        currencyCode: {
          label: 'Currency Code',
          type: 'string',
          description: `Default USD. Currencies should be represented as an ISO 4217 currency code`
        },
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: `Default 1. The quantity of items purchased expressed as a whole number. Must be at least 1 and at most 100.`
        },
        purchaseProperties: {
          label: 'Purchase Properties',
          type: 'object',
          description: `Hash of properties for this purchase. Keys are limited to 255 characters in length, cannot begin with a $, and can only contain alphanumeric characters and punctuation. Values can be numeric, boolean, Date objects, strings 255 characters or shorter, or nested objects whose values can be numeric, boolean, Date objects, arrays, strings, or null. Total size of purchase properties cannot exceed 50KB.`
        }
      },
      type: 'object',
      multiple: true,
      default: {
        '@path': '$.products'
      }
    }
  },
  perform: (client, data) => {
    const payload = data.payload

    if (payload.userId) {
      client.changeUser(payload.userId)
    }

    payload.products?.forEach((product) => {
      const result = client.logPurchase(
        product.productId,
        product.price,
        product.currencyCode ?? 'USD',
        product.quantity ?? 1,
        product.purchaseProperties
      )

      if (!result) {
        console.warn('Braze failed to attach purchase to the session for product ', product.productId)
      }
    })
  }
}

export default action
