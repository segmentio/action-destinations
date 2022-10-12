import { ActionDefinition, RequestClient, omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MixpanelEvent } from '../mixpanel-types'
import { getApiServerUrl, cheapGuid } from '../utils'
import { getEventProperties } from '../trackEvent/functions'
import { eventProperties, productsProperties } from '../mixpanel-properties'
import dayjs from '../../../lib/dayjs'


const topLevelKeys = ["checkout_id", "order_id", "affiliation", "subtotal", "total", "revenue", "shipping", "tax", "discount", "coupon", "currency", "order_number", "products"]

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
        event: "Product Purchased",
        properties: {
          ...omit(orderCompletedEvent.properties, topLevelKeys),
          $insert_id: insertId + (insertIdCount++).toString(),
          time: --time,
          ...product,
        }
      }
    })
  }
  return [orderCompletedEvent, ...purchaseEvents]
}

const processData = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  const events = payload.map((value) => getPurchaseEventsFromPayload(value, settings)).flat()
  return request(`${ getApiServerUrl(settings.apiRegion) }/import?strict=1`, {
    method: 'post',
    json: events,
    headers: {
      authorization: `Basic ${ Buffer.from(`${ settings.apiSecret }:`).toString('base64') }`
    }
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Purchase',
  description:
    "Send an 'Order Completed' Event to Mixpanel.",
  defaultSubscription: 'type = "track"',
  fields: {
    generatePurchaseEventPerProduct: {
      label: 'Generate Purchase Event Per Product',
      description:
        'When enabled, send "Product Purchased" with each product within the event.',
      type: 'boolean',
      default: false
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
    },
  },

  perform: async (request, { settings, payload }) => {
    return processData(request, settings, [payload])
  },

  performBatch: async (request, { settings, payload }) => {
    return processData(request, settings, payload)
  },
}

export default action
