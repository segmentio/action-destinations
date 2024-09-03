import { Payload } from '../saveCustomEvent/generated-types'

export function transformCheckout(payload: Payload) {
  return {
    checkout: {
      currencyCode: payload.checkout?.currencyCode,
      email: payload.customer?.email,
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
      phone: payload.customer?.phone,
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
      },
      billingAddress: {
        address1: payload.checkoutBillingAddress?.address1,
        address2: payload.checkoutBillingAddress?.address2,
        city: payload.checkoutBillingAddress?.city,
        country: payload.checkoutBillingAddress?.country,
        countryCode: payload.checkoutBillingAddress?.country_code,
        firstName: payload.checkoutBillingAddress?.first_name,
        lastName: payload.checkoutBillingAddress?.last_name,
        phone: payload.checkoutBillingAddress?.phone,
        province: payload.checkoutBillingAddress?.province,
        provinceCode: payload.checkoutBillingAddress?.province_code,
        zip: payload.checkoutBillingAddress?.zip
      },
      shippingAddress: {
        address1: payload.checkoutShippingAddress?.address1,
        address2: payload.checkoutShippingAddress?.address2,
        city: payload.checkoutShippingAddress?.city,
        country: payload.checkoutShippingAddress?.country,
        countryCode: payload.checkoutShippingAddress?.country_code,
        firstName: payload.checkoutShippingAddress?.first_name,
        lastName: payload.checkoutShippingAddress?.last_name,
        phone: payload.checkoutShippingAddress?.phone,
        province: payload.checkoutShippingAddress?.province,
        provinceCode: payload.checkoutShippingAddress?.province_code,
        zip: payload.checkoutShippingAddress?.zip
      }
    }
  }
}
