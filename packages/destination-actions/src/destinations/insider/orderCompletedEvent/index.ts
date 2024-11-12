import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  email_as_identifier,
  order_event_parameters,
  phone_number_as_identifier,
  products,
  segment_anonymous_id,
  timestamp,
  user_attributes,
  uuid,
  append_arrays,
  custom_identifiers
} from '../insider-properties'
import { API_BASE, sendBulkTrackEvents, sendTrackEvent, UPSERT_ENDPOINT } from '../insider-helpers'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Order Completed Event',
  description: 'Record Order Completed Event to Insider',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    email_as_identifier: { ...email_as_identifier },
    phone_number_as_identifier: { ...phone_number_as_identifier },
    append_arrays: { ...append_arrays },
    uuid: { ...uuid },
    segment_anonymous_id: { ...segment_anonymous_id },
    custom_identifiers: { ...custom_identifiers },
    timestamp: { ...timestamp },
    parameters: { ...order_event_parameters },
    products: { ...products },
    attributes: { ...user_attributes }
  },
  perform: (request, data) => {
    return request(`${API_BASE}${UPSERT_ENDPOINT}`, {
      method: 'post',
      json: sendTrackEvent(data.payload, 'confirmation_page_view')
    })
  },
  performBatch: (request, data) => {
    return request(`${API_BASE}${UPSERT_ENDPOINT}`, {
      method: 'post',
      json: sendBulkTrackEvents(data.payload, 'confirmation_page_view')
    })
  }
}

export default action
