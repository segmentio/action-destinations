import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  email_as_identifier,
  cart_event_parameters,
  phone_number_as_identifier,
  products,
  segment_anonymous_id,
  timestamp,
  user_attributes,
  uuid
} from '../insider-properties'
import { API_BASE, sendBulkTrackEvents, sendTrackEvent, UPSERT_ENDPOINT } from '../insider-helpers'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Cart Viewed Event',
  description: 'Record Cart Viewed Event to Insider',
  defaultSubscription: 'type = "track" and event = "Cart Viewed"',
  fields: {
    enable_batching: {
      type: 'boolean',
      label: 'Send Batch Request',
      description:
        'When enabled, the action will send a batch request to Insider. Batches can contain up to 1000 records in a request.',
      required: true,
      default: false
    },
    email_as_identifier: { ...email_as_identifier },
    phone_number_as_identifier: { ...phone_number_as_identifier },
    uuid: { ...uuid },
    segment_anonymous_id: { ...segment_anonymous_id },
    timestamp: { ...timestamp },
    parameters: { ...cart_event_parameters },
    products: { ...products },
    attributes: { ...user_attributes }
  },
  perform: (request, data) => {
    return request(`${API_BASE}${UPSERT_ENDPOINT}`, {
      method: 'post',
      json: sendTrackEvent(data.payload, 'cart_page_view')
    })
  },
  performBatch: (request, data) => {
    return request(`${API_BASE}${UPSERT_ENDPOINT}`, {
      method: 'post',
      json: sendBulkTrackEvents(data.payload, 'cart_page_view')
    })
  }
}

export default action
