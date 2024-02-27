import { ActionDefinition, omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL, formatTimestampAsUnixSeconds } from '../index'

function formatPurchasePayload(purchaseEvent: Payload) {
  purchaseEvent.purchase_datetime = formatTimestampAsUnixSeconds(purchaseEvent.purchase_datetime)

  // flatten discount codes + use any top level discount code
  const codeList = []
  if (purchaseEvent.discount_code) {
    codeList.push(purchaseEvent.discount_code)
  }
  if (purchaseEvent.products) {
    for (const product of purchaseEvent.products) {
      if (product.coupon) {
        codeList.push(product.coupon)
      }
    }
  }

  // flatten product SKUs or IDs
  const productList = []
  if (purchaseEvent.products) {
    for (const product of purchaseEvent.products) {
      const productIdentifier = product.product_id || product.sku
      if (productIdentifier) {
        productList.push(productIdentifier)
      }
    }
  }

  return {
    ...omit(purchaseEvent, ["products", "discount_code"]),
    "product_column": productList.join("|"),
    "discount_code": codeList.join("|")
  }

}


const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Transaction Event',
  description: 'Send a purchase event to Actable for prediction. Purchase events should be in v2 Commerce Spec.',
  fields: {
    customer_id: {
      label: 'Customer ID',
      description: 'The unique user identifier.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    discount_code: {
      type: "string",
      label: "Discount Code",
      description: "Discount code, if any, used on purchase. Will be used in addition to per-product coupons in Segment v2commerce events spec.",
      format: "text",
      required: false
    },
    transaction_id: {
      type: "string",
      label: "Transaction ID",
      description: "Optional Identifier for transaction.",
      format: "text",
      required: false,
      default: { '@path': '$.properties.order_id' }

    },
    spend: {
      type: "number",
      label: "Amount",
      description: "Total order amount.",
      format: "text",
      required: false,
      default: { '@path': '$.properties.total' }
    },
    products: {
      type: "object",
      multiple: true,
      label: "Products Purchased",
      description: "product(s) purchased in transaction. This value should be an array of objects which at the minimum contains a Product ID or SKU per-product.",
      format: "text",
      required: true,
      default: { '@path': '$.properties.products' }

    },
    purchase_datetime: {
      type: "datetime",
      label: "Timestamp",
      description: "timestamp of when transaction event occurred.",
      format: "date-time",
      required: true,
      default: { '@path': '$.timestamp' }
    },
    stream_key: {
      type: "string",
      format: "text",
      label: "Stream Key",
      description: "Dataset label, should be left as default unless directed otherwise.",
      required: true,
      default: "transaction"
    }
  },
  perform: (request, data) => {
    return request(API_URL, {
      method: 'post',
      json: { data: [formatPurchasePayload(data.payload)] }
    })
  },
  performBatch: (request, data) => {
    const formattedPayload: object[] = []

    for (const ev of data.payload) {
      formattedPayload.push(formatPurchasePayload(ev))
    }
    return request(API_URL, {
      method: 'post',
      json: { data: formattedPayload }
    })
  }
}
export default action
