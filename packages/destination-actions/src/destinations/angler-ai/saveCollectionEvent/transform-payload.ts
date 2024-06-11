import { Payload } from './generated-types'
import { transformPayload as transformBasePayload } from '../saveBaseEvent/transform-payload'

export function transformCollectionPayload(payload: Payload) {
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

export function transformPayload(payload: Payload) {
  const basePayload = transformBasePayload(payload)
  const collectionPayload = transformCollectionPayload(payload)

  const result = {
    ...basePayload,
    ...collectionPayload
  }

  return result
}
