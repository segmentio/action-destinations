import {
  ActionDefinition,
  RequestClient,
  omit,
  MultiStatusResponse,
  HTTPError,
  ModifiedResponse,
  JSONLikeObject
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MixpanelEvent } from '../mixpanel-types'
import {
  getApiServerUrl,
  cheapGuid,
  MixpanelTrackApiResponseType,
  handleMixPanelApiResponse,
  transformPayloadsType
} from '../common/utils'
import { getEventProperties } from '../trackEvent/functions'
import { eventProperties, productsProperties } from '../mixpanel-properties'
import dayjs from '../../../lib/dayjs'

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

const processData = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  const multiStatusResponse = new MultiStatusResponse()
  const events: MixpanelEvent[] = []
  const sentEvents: JSONLikeObject[] = []
  payload.forEach((value, index) => {
    const purchaseEvents = getPurchaseEventsFromPayload(value, settings).flat()

    multiStatusResponse.setSuccessResponseAtIndex(index, {
      status: 200,
      sent: value as object as JSONLikeObject,
      body: 'Event sent successfully'
    })
    sentEvents.push(purchaseEvents as object as JSONLikeObject)
    events.push(...purchaseEvents)
    return purchaseEvents
  })

  try {
    await callMixpanelApi(request, settings, events)
  } catch (error) {
    if (error instanceof HTTPError) {
      const errorResponse = error.response as ModifiedResponse<MixpanelTrackApiResponseType>
      await handleMixPanelApiResponse(transformPayloadsType(payload), errorResponse, multiStatusResponse, sentEvents)
    } else {
      throw error
    }
  }
  return multiStatusResponse
}

const callMixpanelApi = async (request: RequestClient, settings: Settings, events: MixpanelEvent[]) => {
  return await request<MixpanelTrackApiResponseType>(
    `${getApiServerUrl(settings.apiRegion)}/import?strict=${settings.strictMode ?? `1`}`,
    {
      method: 'post',
      json: events,
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.apiSecret}:`).toString('base64')}`
      }
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

  perform: async (request, { settings, payload }) => {
    const event = getPurchaseEventsFromPayload(payload, settings).flat()
    return await callMixpanelApi(request, settings, event)
  },

  performBatch: async (request, { settings, payload }) => {
    return processData(request, settings, payload)
  }
}

export default action
