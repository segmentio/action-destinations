import { Payload } from './generated-types'
import { transformPayload as transformBasePayload } from '../saveBaseEvent/transform-payload'

export function transformCheckoutPayload(payload: Payload) {
  return {
    checkout: {
      currencyCode: payload.currencyCode,
      lineItems: payload.checkoutLineItems?.map((lineItem) => ({
        discountAllocations: [
          {
            amount: {
              amount: lineItem.discountValue
            },
            discountApplication: {
              title: lineItem.discountTitle,
              value: {
                amount: lineItem.discountValue
              }
            }
          }
        ],
        id: lineItem.id,
        quantity: lineItem.quantity,
        title: lineItem.title,
        variant: {
          id: lineItem.variantId,
          image: {
            src: lineItem.imageSrc
          },
          price: {
            amount: lineItem.priceAmount
          },
          product: {
            id: lineItem.variantId,
            title: lineItem.title,
            untranslatedTitle: lineItem.untranslatedTitle,
            vendor: lineItem.vendor,
            type: lineItem.type,
            url: lineItem.url
          },
          sku: lineItem.sku,
          title: lineItem.title,
          untranslatedTitle: lineItem.untranslatedTitle
        }
      })),
      order: {
        id: payload.orderId
      },
      shippingLine: {
        price: {
          amount: payload.shippingLinePriceAmount
        }
      },
      subtotalPrice: {
        amount: payload.subtotalPriceAmount
      },
      totalPrice: {
        amount: payload.totalAmount
      },
      totalTax: {
        amount: payload.totalTaxAmount
      }
    }
  }
}

export function transformPayload(payload: Payload) {
  const basePayload = transformBasePayload(payload)
  const checkoutPayload = transformCheckoutPayload(payload)

  const result = {
    ...basePayload,
    ...checkoutPayload
  }

  return result
}
