import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  event_at,
  event_type,
  click_id,
  products,
  user,
  data_processing_options,
  screen_dimensions,
  event_metadata,
  hashedUserData
} from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Wishlist',
  description: 'For Add to Wishlist events',
  fields: {
    event_at: event_at,
    event_type: event_type,
    click_id: click_id,
    event_metadata: event_metadata,
    products: products,
    user: user,
    data_processing_options: data_processing_options,
    screen_dimensions: screen_dimensions
    //ADD CONVERSION_ID FIELD

    // Add other fields as needed
  },
  perform: async (request, { settings, payload }) => {
    return processPayload(request, settings, payload)
  }
}

async function processPayload(request: RequestClient, settings: Settings, payload: Payload) {
  const data = createRedditPayload(payload)
  return request(`https://ads-api.reddit.com/api/v2.0/conversions/events/${settings.ad_account_id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.conversion_token}` },
    json: {
      data: data
    }
  })
}

function createRedditPayload(payload: Payload) {
  const advertisingIdKey = payload.user.device_type === 'Apple' ? 'idfa' : 'aaid'
  const hashedUser = hashedUserData(payload.user)
  const cleanedPayload = {
    event_at: payload.event_at,
    event_type: payload.event_type
      ? cleanObject({
          tracking_type: payload.event_type.tracking_type
        })
      : undefined,
    click_id: payload.click_id,
    // NOTE: ADD CONVERSION ID WITHIN EVENT METADATA AFTER WE IMPLEMENT THE JS PIXEL
    event_metadata: payload.event_metadata
      ? cleanObject({
          currency: payload.event_metadata.currency,
          item_count: payload.event_metadata.item_count,
          value_decimal: payload.event_metadata.value_decimal,
          products: payload.products
            ? payload.products.map((product) =>
                cleanObject({
                  category: product.category,
                  id: product.id,
                  name: product.name
                })
              )
            : undefined
        })
      : undefined,
    user: cleanObject({
      [advertisingIdKey]: hashedUser.advertising_id,
      email: hashedUser.email,
      external_id: hashedUser.external_id,
      ip_address: hashedUser.ip_address,
      opt_out: payload.user.opt_out,
      user_agent: payload.user.user_agent,
      uuid: payload.user.uuid,
      data_processing_options: payload.data_processing_options
        ? cleanObject({
            country: payload.data_processing_options.country,
            modes: payload.data_processing_options.modes,
            region: payload.data_processing_options.region
          })
        : undefined,
      screen_dimensions: payload.screen_dimensions
        ? cleanObject({
            height: payload.screen_dimensions.height,
            width: payload.screen_dimensions.width
          })
        : undefined
    })
  }

  return {
    events: [cleanObject(cleanedPayload)],
    partner: 'SEGMENT'
  }
}

function cleanObject(obj: object): object {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value != null))
}

export default action
