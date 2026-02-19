import { RequestClient } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UpsertToCohortJSON } from './types'

export async function send(
  _request: RequestClient,
  payload: Payload[],
  _settings: Settings,
  _isBatch: boolean,
  _audienceSettings?: AudienceSettings
) {

  const json: UpsertToCohortJSON[] = payload.map((p) => {
    const { 
      user_id 
    } = p

    const upsertToCohortJSON = {
      ...(user_id ? { user_id } : {}),
      event_type: '[Segment] Cohort Membership Update',
      time,
      ...(Object.keys(user_properties || {}).length > 0 ? { user_properties } : {}) 
    }

    return upsertToCohortJSON
  })
}
