import { AMPLITUDE_ATTRIBUTION_KEYS } from '@segment/actions-shared'
import { Payload as LogEventPayload} from '../logEvent/generated-types'
import { Payload as LogEventV2Payload} from './generated-types'
import { Payload as PurchasePayload } from '../logPurchase/generated-types'
import { UserProperties, EventRevenue, AmplitudeEvent, JSON } from './types'
import { RequestClient, omit, removeUndefined } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { KEYS_TO_OMIT } from './constants'
import { parseUserAgentProperties } from '../user-agent'
import { formatSessionId } from '../convert-timestamp'
import { getEndpointByRegion } from '../regional-endpoints'
import dayjs from '../../../lib/dayjs'

export function send(request: RequestClient, payload: LogEventPayload | LogEventV2Payload | PurchasePayload, settings: Settings, isPurchaseEvent: boolean) {
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

  const events: AmplitudeEvent[] = [{
    ...(userAgentParsing && parseUserAgentProperties(userAgent, userAgentData)),
    ...(includeRawUserAgent && { user_agent: userAgent }),
    ...rest,
    ...{ user_id: user_id || null },
    ...(platform ? { platform: platform.replace(/ios/i, 'iOS').replace(/android/i, 'Android') } : {}),
    ...(library === 'analytics.js' && !platform ? { platform: 'Web' } : {}),   
    ...(time && dayjs.utc(time).isValid() ? { time: dayjs.utc(time).valueOf() } : {}),
    ...(session_id && dayjs.utc(session_id).isValid() ? { session_id: formatSessionId(session_id) } : {}),
    ...(typeof min_id_length === 'number' && min_id_length > 0 ? { options: { min_id_length } } : {}),
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

  const json: JSON = {
    api_key: settings.apiKey,
    events: events.map(removeUndefined),
    ...(typeof min_id_length === 'number' && min_id_length > 0 ? { options: { min_id_length } } : {})
  }

  const endpoint = getEndpointByRegion(payload.use_batch_endpoint ? 'batch' : 'httpapi', settings.endpoint)

  return request(endpoint, {
    method: 'post',
    json
  })
}

function getUserProperties(payload: LogEventPayload | LogEventV2Payload | PurchasePayload): UserProperties {
    const { 
        autocaptureAttributionEnabled,
        autocaptureAttributionSet,
        autocaptureAttributionSetOnce,
        autocaptureAttributionUnset,
        user_properties
    } = payload

    let setOnce: UserProperties['$setOnce'] = {}
    let setAlways: UserProperties['$set'] = {}
    let add: UserProperties['$add'] = {}

    if ('utm_properties' in payload || 'referrer' in payload) {
      // For LogPurchase and LogEvent Actions
      const { utm_properties, referrer } = payload
      setAlways = {
        ...(referrer ? { referrer } : {}),
        ...(utm_properties || {})
      }
      setOnce = {
        ...(referrer ? { initial_referrer: referrer } : {}),
        ...(utm_properties
          ? Object.fromEntries(Object.entries(utm_properties).map(([k, v]) => [`initial_${k}`, v]))
          : {})
      }
    } 
    else if ('setOnce' in payload || 'setAlways' in payload || 'add' in payload){
      // For LogEventV2 Action
      setOnce = payload.setOnce as UserProperties['$setOnce']
      setAlways = payload.setAlways as UserProperties['$set']
      add = payload.add as UserProperties['$add']
    }

    if (autocaptureAttributionEnabled) {
      // If autocapture attribution is enabled, we need to make sure that attribution keys are not sent from the setAlways and setOnce fields
      for (const key of AMPLITUDE_ATTRIBUTION_KEYS) {
        if( typeof setAlways === "object" && setAlways !== null){
          delete setAlways[key]
        }
        if(typeof setOnce === "object" && setOnce !== null){
          delete setOnce[`initial_${key}`]
        }
      }
    }

    const userProperties = {
      ...user_properties,
      ...(compact(autocaptureAttributionEnabled ? { ...setOnce, ...autocaptureAttributionSetOnce } as { [k: string]: string } : setOnce as { [k: string]: string })
        ? { $setOnce: autocaptureAttributionEnabled ? { ...setOnce, ...autocaptureAttributionSetOnce } as { [k: string]: string }: setOnce as { [k: string]: string }}
        : {}),
      ...(compact(autocaptureAttributionEnabled ? { ...setAlways, ...autocaptureAttributionSet } as { [k: string]: string }: setAlways as { [k: string]: string }) 
        ? { $set: autocaptureAttributionEnabled ? { ...setAlways, ...autocaptureAttributionSet } as { [k: string]: string }: setAlways as { [k: string]: string }}
        : {}),
      ...(compact(add) ? { $add: add as { [k: string]: string } } : {}),
      ...(compact(autocaptureAttributionEnabled ? autocaptureAttributionUnset : {}) 
        ? { $unset: autocaptureAttributionEnabled ? autocaptureAttributionUnset as { [k: string]: string } : {} as { [k: string]: string } } 
        : {})
    }
    return userProperties
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

function compact(object: { [k: string]: unknown } | undefined): boolean {
  return Object.keys(Object.fromEntries(Object.entries(object ?? {}).filter(([_, v]) => v !== ''))).length > 0
}