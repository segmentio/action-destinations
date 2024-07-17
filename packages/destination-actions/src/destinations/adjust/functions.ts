import { RequestClient } from '@segment/actions-core/create-request-client'
import { ModifiedResponse } from '@segment/actions-core/types'

import { AdjustPayload } from './types'
import { Settings } from './generated-types'
import { Payload } from './sendEvent/generated-types'

export function validatePayload(payload: Payload, settings: Settings): AdjustPayload {
  if (!payload.app_token && !settings.default_app_token) {
    throw new Error('Either app_token in the mapping, or default_app_token in settings, must be provided.')
  }

  if (!payload.event_token && !settings.default_event_token) {
    throw new Error('Either event_token in the mapping, or default_event_token in settings, must be provided.')
  }

  const adjustPayload: AdjustPayload = {
    app_token: String(payload.app_token || settings.default_app_token),
    event_token: String(payload.event_token || settings.default_event_token),
    environment: settings.environment,
    s2s: 1,
    callback_params: JSON.stringify(payload)
  }

  if (settings.send_event_creation_time && !payload.timestamp) {
    throw new Error('Event timestamp is required when send_event_creation_time is enabled.')
  }

  adjustPayload.created_at_unix = parseInt((new Date(String(payload.timestamp)).getTime() / 1000).toFixed(0))

  return adjustPayload
}

/**
 * This is ready for batching, but batching is not implemented here for now.
 * @param request The request client.
 * @param events The events.
 * @returns An array of responses.
 */
export async function sendEvents(
  request: RequestClient,
  events: AdjustPayload[]
): Promise<ModifiedResponse<unknown>[]> {
  const responses: Array<ModifiedResponse<unknown>> = await Promise.all(
    events.map((event) =>
      request('https://s2s.adjust.com/event', {
        method: 'POST',
        body: JSON.stringify(event)
      })
    )
  )

  return responses
}
