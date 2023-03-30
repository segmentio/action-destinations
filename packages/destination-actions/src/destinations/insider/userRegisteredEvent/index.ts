import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  email_as_identifier,
  phone_number_as_identifier,
  segment_anonymous_id,
  timestamp,
  user_attributes,
  uuid
} from '../insider-properties'
import { API_BASE, sendTrackEvent, UPSERT_ENDPOINT } from '../insider-helpers'

const action: ActionDefinition<Settings, Payload> = {
  title: 'User Registered Event',
  description: 'Record User Registered Event to Insider',
  defaultSubscription: 'type = "track" and event = "User Registered"',
  fields: {
    email_as_identifier: { ...email_as_identifier },
    phone_number_as_identifier: { ...phone_number_as_identifier },
    uuid: { ...uuid },
    segment_anonymous_id: { ...segment_anonymous_id },
    timestamp: { ...timestamp },
    attributes: { ...user_attributes }
  },
  perform: (request, data) => {
    return request(`${API_BASE}${UPSERT_ENDPOINT}`, {
      method: 'post',
      json: sendTrackEvent(data.payload, 'sign_up_confirmation')
    })
  }
}

export default action
