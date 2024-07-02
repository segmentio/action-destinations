import { Payload } from './generated-types'

export function transformPayload(payload: Payload) {
  const result = {
    event_id: payload.eventId,
    event_name: payload.eventName,
    ip_address: payload.ipAddress,
    user_agent: payload.userAgent,
    timestamp: payload.timestamp,
    fpb: payload.identifiers?.fbp,
    fbc: payload.identifiers?.fbc,
    ga: payload.identifiers?.ga,
    url: payload.page?.url,
    client_id: payload.identifiers?.clientId,
    referrer: payload.page?.referrer,
    data: {
      cart: {
        cost: {
          totalAmount: {
            amount: payload.totalAmount,
            currencyCode: payload.currencyCode
          }
        },
        id: payload.cartId,
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
      },
      customer: {
        id: payload.identifiers?.userId,
        email: payload.customer?.email,
        firstName: payload.customer?.firstName,
        lastName: payload.customer?.lastName,
        phone: payload.customer?.phone,
        dob: payload.customer?.dob
      },
      customData: Object.entries(payload.customAttributes || {}).map(([key, value]) => ({
        name: key,
        value
      }))
    }
  }

  return result
}
