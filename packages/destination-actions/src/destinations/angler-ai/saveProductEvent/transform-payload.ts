import { transform } from '@segment/actions-core/mapping-kit'
import { Payload } from './generated-types'
import { transformPayload as transformBasePayload } from '../saveBaseEvent/transform-payload'

export function transformProductPayload(payload: Payload) {
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

export function transformPayload(payload: Payload) {
  const basePayload = transformBasePayload(payload)
  const productPayload = transformProductPayload(payload)

  const result = {
    ...basePayload,
    ...productPayload
  }

  return result
}
