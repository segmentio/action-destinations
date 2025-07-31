import { Payload } from './generated-types'
import { UserGroupItem } from './types'
import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { apiBaseUrl } from '../constants'

export function processPayloads(request: RequestClient, payloads: Payload[], settings: Settings) {
  const json: UserGroupItem[] = payloads.map(processPayload)
  const url = `${apiBaseUrl}/applications/${settings.clientId}/segment-audience-sync/`
  return request(url, {
    method: 'post',
    json
  })
}

function processPayload(payload: Payload): UserGroupItem {
  const {
    audience_id,
    audience_name,
    action,
    timestamp,
    user_id,
    traits_or_properties_hidden,
    additional_user_traits
  } = payload
  const actionValue = typeof action === 'boolean' ? action : traits_or_properties_hidden?.[audience_name]

  if (typeof actionValue !== 'boolean') {
    throw new PayloadValidationError(
      'Action must be a boolean value (true for add, false for remove). If connecting to an Engage Audience, leave this field empty and ensure the audience_id and audience_name field mappings are left to their default values.'
    )
  }

  const json: UserGroupItem = {
    audience_id,
    audience_name,
    action: actionValue,
    timestamp,
    user_id,
    ...(additional_user_traits ?? {})
  }

  return json
}
