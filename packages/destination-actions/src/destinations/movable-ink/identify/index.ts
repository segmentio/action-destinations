import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { movable_ink_url, user_id, anonymous_id, timestamp, timezone } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Send an Identify event to Movable Ink, to assocate a userId with an anonymousId',
  defaultSubscription: 'type = "identify"',
  fields: {
    movable_ink_url,
    user_id,
    anonymous_id,
    timestamp,
    timezone
  },
  perform: (request, { settings, payload }) => {
    const url = payload?.movable_ink_url ?? settings?.movable_ink_url
    if (!url)
      throw new IntegrationError(
        '"Movable Ink URL" setting or "Movable Ink URL" field must be populated',
        'MISSING_DESTINATION_URL',
        400
      )

    return request(url, {
      method: 'POST',
      json: {
        user_id: payload.user_id,
        anonymous_id: payload.anonymous_id,
        timestamp: payload.timestamp,
        timezone: payload.timezone
      }
    })
  }
}

export default action
