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
  const serverSecretToken = `${settings.apiKey}.${settings.serverToken}`
  return {
    url: `${apiBaseUrl}/${relativeUrl}?token=${serverSecretToken}`,
    options: {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': serverSecretToken
      }
    }
  }
}

/**
 * Returns {@link RequestParams} for identifying a user.
 * @param settings Settings configured for the cloud mode destination.
 * @param userProperties Properties to identify the user with.
 * @param additionalProperties
 */
export const identifyUserRequestParams = (
  settings: Settings,
  userProperties: {
    userId: string
    email: string
    createdAt: string
    anonymousId?: string
  },
  additionalProperties?: Record<string, unknown>
): RequestParams => {
  let userPayload: any = {
    anonymous_id: userProperties.anonymousId || generateId(),
    id: userProperties.userId,
    email: userProperties.email,
    created_at: userProperties.createdAt
  }

  // Add additional properties
  if (additionalProperties) {
    userPayload = {
      ...userPayload,
      ...additionalProperties
    }
  }

  return {
    ...defaultRequestParams(settings, 'api/v1/s2s/event'),
    options: {
      ...defaultRequestParams(settings, 'api/v1/s2s/event').options,
      json: {
        api_key: settings.apiKey,
        event_id: '',
        event_type: 'user_identify',
        ids: {},
        user: userPayload,
        screen_resolution: '0',
        src: 'usermaven-segment'
      }
    }
  }
}
