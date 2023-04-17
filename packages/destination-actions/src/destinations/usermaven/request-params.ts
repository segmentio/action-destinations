import { Settings } from './generated-types'
import { RequestOptions } from '@segment/actions-core'
import { generateId } from './vars'

const apiBaseUrl = 'https://events.usermaven.com'

/**
 * Parameters intended to be passed into a RequestClient.
 */
interface RequestParams {
  url: string
  options: RequestOptions
}

/**
 * Returns default {@link RequestParams} suitable for most UserMaven HTTP API requests.
 *
 * @param settings Settings configured for the cloud mode destination.
 * @param relativeUrl The relative URL from the FullStory API domain root.
 */
const defaultRequestParams = (settings: Settings, relativeUrl: string): RequestParams => {
  return {
    url: `${apiBaseUrl}/${relativeUrl}?token=${settings.api_key}`,
    options: {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  }
}

/**
 * Returns {@link RequestParams} for identifying a user.
 * @param settings Settings configured for the cloud mode destination.
 * @param payload The payload.
 * @param eventType
 */
export const eventRequestParams = (
  settings: Settings,
  payload?: Record<string, unknown>,
  eventType?: string
): RequestParams => {
  const defaultRequest = defaultRequestParams(settings, 'api/v1/event')

  return {
    ...defaultRequest,
    options: {
      ...defaultRequest.options,
      json: {
        ...payload,
        event_type: eventType || payload?.event_type
      }
    }
  }
}

/**
 * Returns {@link RequestParams} for with revolved properties.
 * @param settings
 * @param payload
 */
export const resolveRequestPayload = (settings: Settings, payload: Record<string, any>): any => {
  const properties: any = {
    api_key: settings.api_key,
    ids: {},
    doc_encoding: 'utf-8',
    src: 'usermaven-segment',
    ...payload
  }

  // Resolve doc_host property, we can get doc_host from the payload url
  if (payload.url) {
    const url = new URL(payload.url as string)
    properties.doc_host = url.host
  }

  // Resolve screen_resolution and vp_size properties, we can get from the payloadscreen
  if (payload?.screen) {
    const { width, height } = payload.screen
    properties.screen_resolution = `${width || 0}x${height || 0}`
    properties.vp_size = `${width || 0}x${height || 0}`

    delete properties.screen
  }

  // Resolve local_tz_offset property, we can get local_tz_offset from the payload context.timezone
  // And we need to convert the timezone (e.g: Europe/Amsterdam) to the offset (e.g: +0200)
  if (payload?.timezone) {
    const timezone = payload.timezone
    const date = new Date()
    const offset = date.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'short' }).split(' ')[2]
    properties.local_tz_offset = offset

    delete properties.timezone
  }

  // Check if event property is present, we will use it as event_type
  if (payload?.event) {
    properties.event_type = payload.event
    delete properties.event
  }

  // Resolve user properties
  properties.user = {
    id: payload?.user_id,
    anonymous_id: payload?.user_anonymous_id || generateId(),
    email: payload?.user_email,
    first_name: payload?.user_first_name,
    last_name: payload?.user_last_name,
    custom: payload?.user_custom_attributes
  }

  // Delete unnecessary user properties
  delete properties.user_id
  delete properties.user_anonymous_id
  delete properties.user_email
  delete properties.user_first_name
  delete properties.user_last_name
  delete properties.user_custom_attributes

  // Resolve company properties
  properties.company = {
    id: payload?.company_id,
    name: payload?.company_name,
    created_at: payload?.company_created_at,
    custom: payload?.company_custom_attributes
  }

  // Delete unnecessary company properties
  delete properties.company_id
  delete properties.company_name
  delete properties.company_created_at
  delete properties.company_custom_attributes

  return properties
}
