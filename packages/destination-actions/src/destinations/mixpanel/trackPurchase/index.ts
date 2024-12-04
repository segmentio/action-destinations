import { ActionDefinition, RequestClient, omit, JSONLikeObject } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MixpanelEvent } from '../mixpanel-types'
import { getApiServerUrl, cheapGuid, MixpanelTrackApiResponseType, handleMixPanelApiResponse } from '../common/utils'
import { getEventProperties } from '../trackEvent/functions'
import { eventProperties, productsProperties } from '../mixpanel-properties'
import dayjs from '../../../lib/dayjs'
import { Features } from '@segment/actions-core/mapping-kit'

const topLevelKeys = [
  'affiliation',
  'subtotal',
  'total',
  'revenue',
  'shipping',
  'tax',
  'discount',
  'coupon',
  'currency',
  'order_number',
  'products'
]

const getPurchaseEventsFromPayload = (payload: Payload, settings: Settings): MixpanelEvent[] => {
  const orderCompletedEvent: MixpanelEvent = {
    event: payload.event,
    properties: {
      ...getEventProperties(payload, settings)
    }
  }
  let purchaseEvents: MixpanelEvent[] = []
  if (payload.products && payload.generatePurchaseEventPerProduct) {
    const datetime = payload.time
    let time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()
    const insertId = payload.insert_id ?? cheapGuid()
    let insertIdCount = 0
    purchaseEvents = payload.products.map((product) => {
      return {
        event: 'Product Purchased',
        properties: {
          ...omit(orderCompletedEvent.properties, topLevelKeys),
          $insert_id: (insertIdCount++).toString() + insertId,
          time: --time,
          ...product
        }
      }
    })
  }
  return [orderCompletedEvent, ...purchaseEvents]
}

const processData = async (request: RequestClient, settings: Settings, payload: Payload[], features?: Features) => {
  const events: MixpanelEvent[] = []
  const sentEvents: JSONLikeObject[] = []
  payload.forEach((value) => {
    const purchaseEvents = getPurchaseEventsFromPayload(value, settings).flat()
    sentEvents.push(purchaseEvents as object as JSONLikeObject)
    events.push(...purchaseEvents)
    return purchaseEvents
  })
  const throwHttpErrors = features && features['mixpanel-multistatus'] ? false : true

  const response = await callMixpanelApi(request, settings, events, throwHttpErrors)
  if (features && features['mixpanel-multistatus']) {
    return handleMixPanelApiResponse(payload.length, response, sentEvents)
  }
  return response
}

const callMixpanelApi = async (
  request: RequestClient,
  settings: Settings,
  events: MixpanelEvent[],
  throwHttpErrors: boolean
) => {
  return await request<MixpanelTrackApiResponseType>(
    `${getApiServerUrl(settings.apiRegion)}/import?strict=${settings.strictMode ?? `1`}`,
    {
      method: 'post',
      json: events,
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.apiSecret}:`).toString('base64')}`
      },
      throwHttpErrors: throwHttpErrors
    }
  )
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Purchase',
  description: "Send an 'Order Completed' Event to Mixpanel.",
  defaultSubscription: 'type = "track"',
  fields: {
    generatePurchaseEventPerProduct: {
      label: 'Generate Purchase Event Per Product',
      description: 'When enabled, send "Product Purchased" with each product within the event.',
      type: 'boolean',
      default: true
    },
    ...eventProperties,
    ...productsProperties,
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the action being performed.',
      required: true,
      default: {
        '@path': '$.event'
      }
    }
  },

  perform: async (request, { settings, payload, features }) => {
    return processData(request, settings, [payload], features)
  },

  performBatch: async (request, { settings, payload, features }) => {
    return processData(request, settings, payload, features)
  }
}

export default action
