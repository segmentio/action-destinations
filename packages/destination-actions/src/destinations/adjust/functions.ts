import { RequestClient } from '@segment/actions-core/create-request-client'
import { IntegrationError } from '@segment/actions-core'
import { AdjustPayload } from './types'
import { Settings } from './generated-types'
import { Payload } from './sendEvent/generated-types'

export function validatePayload(payload: Payload, settings: Settings): AdjustPayload {
  if (!payload.app_token && !settings.default_app_token) {
    throw new IntegrationError(
      'One of app_token field or default_app_token setting fields must have a value.',
      'APP_TOKEN_VALIDATION_FAILED',
      400
    )
  }

  if (!payload.event_token && !settings.default_event_token) {
    throw new IntegrationError(
      'One of event_token field or default_event_token setting fields must have a value.',
      'EVENT_TOKEN_VALIDATION_FAILED',
      400
    )
  }

  const adjustPayload: AdjustPayload = {
    app_token: String(payload.app_token || settings.default_app_token),
    event_token: String(payload.event_token || settings.default_event_token),
    environment: settings.environment,
    s2s: 1,
    callback_params: JSON.stringify(payload),
    created_at_unix: payload.timestamp
      ? parseInt((new Date(String(payload.timestamp)).getTime() / 1000).toFixed(0))
      : undefined
  }

  return adjustPayload
}

/**
 * This is ready for batching, but batching is not implemented here for now.
 * @param request The request client.
 * @param events The events.
 * @returns An array of responses.
 */
export async function sendEvents(request: RequestClient, events: AdjustPayload[]) {
  return await Promise.all(
    events.map((event) =>
      request('https://s2s.adjust.com/event', {
        method: 'POST',
        body: JSON.stringify(event)
      })
    )
  )
}
