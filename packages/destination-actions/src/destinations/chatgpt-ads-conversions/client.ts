import { APIError, InvalidAuthenticationError, RetryableError } from '@segment/actions-core'
import type { ModifiedResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { API_URL } from './constants'
import type { formatEvent } from './reportWebEvent/format'

export async function sendEvent(
  request: RequestClient,
  settings: Settings,
  event: ReturnType<typeof formatEvent>,
  validateOnly = false
) {
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(settings.pixel_id)) {
    throw new InvalidAuthenticationError('Enter a valid Pixel ID from Ads Manager.')
  }
  if (!/^[\x21-\x7e]+$/.test(settings.api_key ?? '')) {
    throw new InvalidAuthenticationError('Enter a valid Conversions API key.')
  }
  let response: ModifiedResponse<{ accepted_events?: number }>
  try {
    response = await request<{ accepted_events?: number }>(API_URL, {
      method: 'POST',
      searchParams: { pid: settings.pixel_id },
      headers: { Authorization: `Bearer ${settings.api_key}`, 'Content-Type': 'application/json' },
      json: { integration_source: 'segment', validate_only: validateOnly, events: [event] },
      // Never follow a redirect with customer data. Segment controls retry scheduling.
      redirect: 'manual',
      throwHttpErrors: false
    })
  } catch {
    // Transport errors can carry request headers, bodies, or upstream messages.
    // Do not attach the original error. Acceptance is unknown, so retain the event ID on retry.
    throw new RetryableError('CAPI request failed or its response could not be read. Retry with the same Event ID.')
  }
  if (response.status === 401 || response.status === 403) {
    throw new InvalidAuthenticationError('Check that the CAPI key can send events for this Pixel ID.')
  }
  if (response.status < 200 || response.status >= 300) {
    // Do not echo a response body: it may contain customer values.
    const detail =
      response.status === 400
        ? 'CAPI rejected the event. Check the field mappings, currency, and event time (within 7 days, at most 10 minutes ahead).'
        : `CAPI returned HTTP ${response.status}.`
    throw new APIError(detail, response.status)
  }
  if (response.data?.accepted_events !== 1) {
    throw new RetryableError('CAPI did not confirm acceptance of the event. Retry with the same Event ID.')
  }
  return response
}
