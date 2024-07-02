import { Payload } from './generated-types'
import { transformPayload as transformBasePayload } from '../saveBaseEvent/transform-payload'

export function transformSearchPayload(payload: Payload) {
  return {
    searchResult: {
      query: payload.query,
      productVariants: payload.searchResults?.map((productVariant) => ({
        id: productVariant.variantId,
        image: {
          src: productVariant.imageSrc
        },
        price: {
          amount: productVariant.priceAmount
        },
        product: {
          id: productVariant.id,
          title: productVariant.title,
          untranslatedTitle: productVariant.untranslatedTitle,
          vendor: productVariant.vendor,
          type: productVariant.type,
          url: productVariant.url
        },
        sku: productVariant.sku,
        title: productVariant.title,
        untranslatedTitle: productVariant.untranslatedTitle
      }))
    }
  }
}

export function transformPayload(payload: Payload) {
  const basePayload = transformBasePayload(payload)
  const searchPayload = transformSearchPayload(payload)

  const result = {
    ...basePayload,
    ...searchPayload
  }

  return result
}
