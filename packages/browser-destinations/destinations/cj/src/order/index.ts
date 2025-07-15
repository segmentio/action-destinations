import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { CJ, SimpleOrder, AdvancedOrder } from '../types'
import { getCookieValue } from './utils'
import { send, smartHash, normalizeEmail } from '../utils'
import { orderFields } from './order-fields'


const action: BrowserActionDefinition<Settings, CJ, Payload> = {
  title: 'Order',
  description: 'Send order data to CJ.',
  defaultSubscription: 'event = "Order Completed"',
  platform: 'web',
  fields: orderFields,
  perform: (cj, { payload, settings }) => {

    const { 
      userId, 
      enterpriseId, 
      pageType, 
      emailHash, 
      orderId, 
      actionTrackerId, 
      currency, 
      amount, 
      discount, 
      coupon, 
      cjeventOrderCookieName, 
      items, 
      allVerticals, 
      travelVerticals, 
      financeVerticals, 
      networkServicesVerticals 
    } = payload

    const cjeventOrder: string | null = getCookieValue(cjeventOrderCookieName)

    if(!cjeventOrder){
      console.warn(`Segment CJ Actions Destination: Cookie ${cjeventOrderCookieName} not found. Please ensure the cookie is set before calling this action.`)
    }

    const actionTrackerIdFromSettings = settings.actionTrackerId

    if(!actionTrackerId || !actionTrackerIdFromSettings) {
      console.warn('Segment CJ Actions Destination: Missing actionTrackerId. This can be set as a Setting or as an Action field value.')
    }

    const hashedEmail = smartHash(emailHash ?? '', normalizeEmail) ?? undefined

    const order: SimpleOrder | AdvancedOrder = {
      userId, 
      enterpriseId, 
      pageType, 
      emailHash: hashedEmail, 
      orderId, 
      actionTrackerId: actionTrackerId ?? actionTrackerIdFromSettings ?? '',
      currency, 
      amount, 
      discount, 
      coupon, 
      cjeventOrder: cjeventOrder ?? '',
      items,
      ...allVerticals,
      ...travelVerticals,
      ...financeVerticals,
      ...networkServicesVerticals
    }
    cj.sitePage = undefined
    cj.order = order  

    const { tagId } = settings
    send(tagId)
  }
}



export default action
