import { Payload } from './generated-types'
import { transformPayload as transformBasePayload } from '../saveBaseEvent/transform-payload'

export function transformCartPayload(payload: Payload) {
  return {
    cartLine: {
      cost: {
        totalAmount: {
          amount: payload.cartLine?.priceAmount
        }
      },
      merchandise: {
        id: payload.cartLine?.variantId,
        image: {
          src: payload.cartLine?.imageSrc
        },
        price: {
          amount: payload.cartLine?.priceAmount
        },
        product: {
          title: payload.cartLine?.title,
          untranslatedTitle: payload.cartLine?.untranslatedTitle,
          vendor: payload.cartLine?.vendor,
          type: payload.cartLine?.type,
          url: payload.cartLine?.url
        },
        sku: payload.cartLine?.sku,
        title: payload.cartLine?.title,
        untranslatedTitle: payload.cartLine?.untranslatedTitle
      },
      quantity: payload.cartLine?.quantity
    }
  }
}

export function transformPayload(payload: Payload) {
  const basePayload = transformBasePayload(payload)
  const cartPayload = transformCartPayload(payload)

  const result = {
    ...basePayload,
    ...cartPayload
  }

  return result
}
