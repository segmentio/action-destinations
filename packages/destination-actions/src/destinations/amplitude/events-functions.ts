import { Payload as LogEventPayload} from './logEvent/generated-types'
import { Payload as LogEventV2Payload} from './logEventV2/generated-types'
import { Payload as PurchasePayload } from './logPurchase/generated-types'
import { EventRevenue, AmplitudeEventJSON, JSON_PAYLOAD } from './types'
import { RequestClient, omit, removeUndefined } from '@segment/actions-core'
import { Settings } from './generated-types'
import { KEYS_TO_OMIT } from './events-constants'
import { parseUserAgentProperties } from './common-functions'
import dayjs from '../../lib/dayjs'
import { getEndpointByRegion, getUserProperties } from './common-functions'

export function send(
  request: RequestClient, 
  payload: LogEventPayload | LogEventV2Payload | PurchasePayload, 
  settings: Settings, 
  isPurchaseEvent: boolean, 
 ) {

  const {
    time,
    session_id,
    userAgent,
    userAgentParsing,
    includeRawUserAgent,
    userAgentData,
    min_id_length,
    platform,
    library,
    user_id,
    products = [],
    ...rest
  } = omit(payload, KEYS_TO_OMIT)

  let trackRevenuePerProduct = false
  if ('trackRevenuePerProduct' in payload) {
    trackRevenuePerProduct = payload.trackRevenuePerProduct || false
  }

  const user_properties = getUserProperties(payload)

  const events: AmplitudeEventJSON[] = [{
    ...(userAgentParsing && parseUserAgentProperties(userAgent, userAgentData)),
    ...(includeRawUserAgent && { user_agent: userAgent }),
    ...rest,
    ...{ user_id: user_id || null },
    ...(platform ? { platform: platform.replace(/ios/i, 'iOS').replace(/android/i, 'Android') } : {}),
    ...(library === 'analytics.js' && !platform ? { platform: 'Web' } : {}),   
    ...(time && dayjs.utc(time).isValid() ? { time: dayjs.utc(time).valueOf() } : {}),
    ...(session_id && dayjs.utc(session_id).isValid() ? { session_id: formatSessionId(session_id) } : {}),
    ...(user_properties ? { user_properties } : {}),
    ...(products.length && trackRevenuePerProduct ? {} : getRevenueProperties(payload)),
    library: 'segment'
  }]

  if(isPurchaseEvent){
    const mainEvent = events[0] 
    for (const product of products) {
      events.push({
        ...mainEvent,
        ...(trackRevenuePerProduct ? getRevenueProperties(product as EventRevenue) : {}),
        event_properties: product,
        event_type: 'Product Purchased',
        insert_id: mainEvent.insert_id ? `${mainEvent.insert_id}-${events.length + 1}` : undefined
      })
    }
  }

  const json: JSON_PAYLOAD = {
    api_key: settings.apiKey,
    events: events.map(removeUndefined),
    ...(typeof min_id_length === 'number' && min_id_length > 0 ? { options: { min_id_length } } : {})
  }

  const url = getEndpointByRegion(payload.use_batch_endpoint ? 'batch' : 'httpapi', settings.endpoint)

  return request(url, {
    method: 'post',
    json
  })
}

function getRevenueProperties(payload: EventRevenue): EventRevenue {
  let { revenue } = payload
  const { quantity, price, revenueType, productId } = payload
  if (typeof quantity === 'number' && typeof price === 'number') {
    revenue = quantity * price
  }
  if (!revenue) {
    return {}
  }
  return {
    revenue,
    revenueType: revenueType ?? 'Purchase',
    quantity: typeof quantity === 'number' ? Math.round(quantity) : undefined,
    price: price,
    productId
  }
}

export function formatSessionId(session_id: string | number): number {
  // Timestamps may be on a `string` field, so check if the string is only
  // numbers. If it is, convert it into a Number since it's probably already a unix timestamp.
  // DayJS doesn't parse unix timestamps correctly outside of the `.unix()`
  // initializer.
  if (typeof session_id === 'string' && /^\d+$/.test(session_id)) {
    return Number(session_id)
  }
  return dayjs.utc(session_id).valueOf()
}