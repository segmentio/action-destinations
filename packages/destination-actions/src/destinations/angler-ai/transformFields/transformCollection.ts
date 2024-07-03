import { Payload } from '../saveCustomEvent/generated-types'

export function transformCollection(payload: Payload) {
  return {
    collection: {
      id: payload.collection?.id,
      title: payload.collection?.title,
      productVariants: payload.collectionProductVariants?.map((collectionProductVariant) => ({
        id: collectionProductVariant.variantId,
        image: {
          src: collectionProductVariant.imageSrc
        },
        price: {
          amount: collectionProductVariant.priceAmount
        },
        product: {
          id: collectionProductVariant.id,
          title: collectionProductVariant.title,
          untranslatedTitle: collectionProductVariant.untranslatedTitle,
          vendor: collectionProductVariant.vendor,
          type: collectionProductVariant.type,
          url: collectionProductVariant.url
        },
        sku: collectionProductVariant.sku,
        title: collectionProductVariant.title,
        untranslatedTitle: collectionProductVariant.untranslatedTitle
      }))
    }
  }
}
