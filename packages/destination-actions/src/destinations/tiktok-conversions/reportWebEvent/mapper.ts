import type { Payload } from './generated-types'

export class mapper {
  static mapEvents(payload: Payload) {
    let event = 'Checkout Started'

    if (payload.type === 'page') {
      event = 'View Content'
    } else {
      switch (payload.event) {
        case 'Products Searched':
          event = 'Search'
          break
        case 'Checkout Started':
          event = 'InitiateCheckout'
          break
        case 'Order Completed':
          event = 'PlaceOrder'
          break
        default:
          event = ''
      }
    }
    console.log(event)
    return event
  }
}
