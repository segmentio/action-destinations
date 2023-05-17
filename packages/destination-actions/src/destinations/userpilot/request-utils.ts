import type { Settings } from './generated-types'
import type { Payload as IdentifyPayload } from './identifyUser/generated-types'
import type { Payload as TrackPayload } from './trackEvent/generated-types'

import { RequestOptions } from '@segment/actions-core'

const baseURL = 'https://analytex.userpilot.io'

interface RequestParams {
  url: string
  options: RequestOptions
}

export const getDeleteRequestParams = (settings: Settings, userId: string): RequestParams => {
  return {
    url: `${validateEndpoint(settings.endpoint)}v1/users`,
    options: {
      method: 'DELETE',
      json: { users: [userId] },
      headers: getHeaders(settings)
    }
  }
}

export const getValidationParams = (settings: Settings): RequestParams => {
  return {
    url: `${validateEndpoint(settings.endpoint)}v1/users`,
    options: {
      method: 'GET',
      headers: getHeaders(settings)
    }
  }
}

export const getIdentifyRequestParams = (settings: Settings, payload: IdentifyPayload): RequestParams => {
  const { traits, anonymousId, userId } = payload
  return {
    url: `${validateEndpoint(settings.endpoint)}v1/identify`,
    options: {
      method: 'POST',
      json: {
        user_id: userId || anonymousId,
        metadata: traits
      },
      headers: getHeaders(settings)
    }
  }
}

export const getTrackEventParams = (settings: Settings, payload: TrackPayload): RequestParams => {
  const { userId, anonymousId, name, properties } = payload
  return {
    url: `${validateEndpoint(settings.endpoint)}v1/track`,
    options: {
      method: 'POST',
      json: {
        user_id: userId || anonymousId,
        event_name: name,
        metadata: properties
      },
      headers: getHeaders(settings)
    }
  }
}

const getHeaders = (settings: Settings) => {
  return {
    'Content-Type': 'application/json',
    Authorization: `Token ${settings.apiKey}`,
    'X-API-Version': '2020-09-22'
  }
}

const validateEndpoint = (url: string) => {
  try {
    new URL(url)
    return url
  } catch (e) {
    return baseURL
  }
}
