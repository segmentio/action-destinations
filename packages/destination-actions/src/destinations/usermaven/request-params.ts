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
    event_id: '',
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

  // Resolve screen_resolution property, we can get screen_resolution from the payload context.screen
  if (payload?.context?.screen) {
    const { width, height } = payload.context.screen
    properties.screen_resolution = `${width}x${height}`
  }

  // Resolve vp_size property, we can get vp_size from the payload context.screen
  if (payload?.context?.screen) {
    const { width, height } = payload.context.screen
    properties.vp_size = `${width}x${height}`
  }

  // Resolve local_tz_offset property, we can get local_tz_offset from the payload context.timezone
  // And we need to convert the timezone (e.g: Europe/Amsterdam) to the offset (e.g: +0200)
  if (payload?.context?.timezone) {
    const timezone = payload.context.timezone
    const date = new Date()
    const offset = date.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'short' }).split(' ')[2]
    properties.local_tz_offset = offset
  }

  // Check if annonymousId is not present, we need to generate a random annonymous Id
  if (!payload?.user?.anonymous_id) {
    properties.user = {
      ...payload.user,
      anonymous_id: generateId()
    }
  }

  // Check if event property is present, we will use it as event_type
  if (payload?.event) {
    properties.event_type = payload.event
  }

  // Remove unnecessary properties from the payload
  delete properties.screen
  delete properties.timezone
  delete properties.event

  return properties
}
