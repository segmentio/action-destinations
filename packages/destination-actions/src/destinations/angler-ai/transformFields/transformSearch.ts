import { Payload } from '../saveCustomEvent/generated-types'

export function transformSearch(payload: Payload) {
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
