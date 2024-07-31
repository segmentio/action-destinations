import { Payload } from '../saveCustomEvent/generated-types'

export function transformProductVariant(payload: Payload) {
  return {
    productVariant: {
      id: payload.productVariant?.variantId,
      image: {
        src: payload.productVariant?.imageSrc
      },
      price: {
        amount: payload.productVariant?.priceAmount
      },
      product: {
        id: payload.productVariant?.id,
        title: payload.productVariant?.title,
        untranslatedTitle: payload.productVariant?.untranslatedTitle,
        vendor: payload.productVariant?.vendor,
        type: payload.productVariant?.type,
        url: payload.productVariant?.url
      },
      sku: payload.productVariant?.sku,
      title: payload.productVariant?.title,
      untranslatedTitle: payload.productVariant?.untranslatedTitle
    }
  }
}
