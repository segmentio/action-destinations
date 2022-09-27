import { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MixpanelEvent } from '../mixpanel-types'
import { getApiServerUrl, cheapGuid } from '../utils'
import { getEventProperties } from '../trackEvent/functions'
import { eventProperties, productsProperties } from '../mixpanel-properties'


const getPurchaseEventsFromPayload = (payload: Payload, settings: Settings): MixpanelEvent[] => {
  const orderCompletedEvent: MixpanelEvent = {
    event: payload.event,
    properties: {
      ...getEventProperties(payload, settings)
    }
  }
  let purchaseEvents: MixpanelEvent[] = []
  if (payload.products) {
    purchaseEvents = payload.products.map((product) => {
      return {
        event: "Product Purchased",
        properties: {
          ...orderCompletedEvent.properties,
          $insert_id: cheapGuid(),
          ...product
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
