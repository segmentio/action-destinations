import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { CJ, SimpleOrder, AdvancedOrder } from '../types'
import { send } from '../utils'
import { getCookieValue, setOrderJSON } from './utils'
import { smartHash, normalizeEmail } from './hashing-utils'
import { orderFields } from './order-fields'

const action: BrowserActionDefinition<Settings, CJ, Payload> = {
  title: 'Order',
  description: 'Send order data to CJ.',
  defaultSubscription: 'event = "Order Completed"',
  platform: 'web',
  fields: orderFields,
  perform: async (cj, { payload, settings }) => {
    const {
      verticalType,
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

    if (!cjeventOrder) {
      console.warn(
        `Segment CJ Actions Destination: Cookie ${cjeventOrderCookieName} not found. Please ensure the cookie is set before calling this action.`
      )
    }

    const actionTrackerIdFromSettings = settings.actionTrackerId

    if (!actionTrackerId && !actionTrackerIdFromSettings) {
      console.warn(
        'Segment CJ Actions Destination: Missing actionTrackerId. This can be set as a Setting or as an Action field value.'
      )
    }

    const order: SimpleOrder | AdvancedOrder = {
      trackingSource: 'Segment',
      userId,
      enterpriseId,
      pageType,
      emailHash: emailHash ? await smartHash(emailHash, normalizeEmail) : undefined,
      orderId,
      actionTrackerId: actionTrackerId ?? actionTrackerIdFromSettings ?? '',
      currency,
      amount,
      discount,
      coupon,
      cjeventOrder: cjeventOrder ?? '',
      items,
      ...allVerticals,
      ...(verticalType === 'travel' ? travelVerticals : {}),
      ...(verticalType === 'finance' ? financeVerticals : {}),
      ...(verticalType === 'network' ? networkServicesVerticals : {})
    }

    if ('customerCountry' in order && typeof order.customerCountry === 'string') {
      order.customerCountry = order.customerCountry.split('-').pop() || undefined
    }

    setOrderJSON(cj, order)
    const { tagId } = settings
    send(tagId)
      .then(() => {
        cj.sitePage = undefined
        cj.order = undefined
      })
      .catch((err) => {
        console.warn(err)
      })
  }
}

export default action
