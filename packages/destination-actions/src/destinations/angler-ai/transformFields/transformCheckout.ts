import { Payload } from '../saveCustomEvent/generated-types'

export function transformCheckout(payload: Payload) {
  return {
    checkout: {
      currencyCode: payload.checkout?.currencyCode,
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
        id: payload.checkout?.orderId
      },
      shippingLine: {
        price: {
          amount: payload.checkout?.shippingLinePriceAmount
        }
      },
      subtotalPrice: {
        amount: payload.checkout?.subtotalPriceAmount
      },
      totalPrice: {
        amount: payload.checkout?.totalAmount
      },
      totalTax: {
        amount: payload.checkout?.totalTaxAmount
      }
    }
  }
}
