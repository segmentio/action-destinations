import { Payload } from '../saveCustomEvent/generated-types'

export function transformCart(payload: Payload) {
  return {
    cart: {
      cost: {
        totalAmount: {
          amount: payload.cart?.totalAmount,
          currencyCode: payload.cart?.currencyCode
        }
      },
      id: payload.cart?.id,
      lines: payload.cartLines?.map((cartLine) => ({
        cost: {
          totalAmount: {
            amount: cartLine.priceAmount
          }
        },
        merchandise: {
          id: cartLine.variantId,
          image: {
            src: cartLine.imageSrc
          },
          price: {
            amount: cartLine.priceAmount
          },
          product: {
            title: cartLine.title,
            untranslatedTitle: cartLine.untranslatedTitle,
            vendor: cartLine.vendor,
            type: cartLine.type,
            url: cartLine.url
          },
          sku: cartLine.sku,
          title: cartLine.title,
          untranslatedTitle: cartLine.untranslatedTitle
        },
        quantity: cartLine.quantity
      }))
    }
  }
}
