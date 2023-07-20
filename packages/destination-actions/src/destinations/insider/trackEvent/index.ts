import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_BASE, UPSERT_ENDPOINT, sendTrackEvent } from '../insider-helpers'
import {
  email_as_identifier,
  event_name,
  getEventParameteres,
  phone_number_as_identifier,
  products,
  segment_anonymous_id,
  timestamp,
  user_attributes,
  uuid
} from '../insider-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Record custom event to Insider',
  defaultSubscription: 'type = "track"',
  fields: {
    email_as_identifier: { ...email_as_identifier },
    phone_number_as_identifier: { ...phone_number_as_identifier },
    uuid: { ...uuid },
    segment_anonymous_id: { ...segment_anonymous_id },
    event_name: { ...event_name },
    timestamp: { ...timestamp },
    parameters: { ...getEventParameteres([]) },
    products: { ...products },
    attributes: { ...user_attributes }
  },
  perform: (request, data) => {
    return request(`${API_BASE}${UPSERT_ENDPOINT}`, {
      method: 'post',
      json: sendTrackEvent(
        data.payload,
        data.payload.event_name.toString().toLowerCase().trim().split(' ').join('_').toString()
      )
    })
  }
}

export default action
