import type { Settings } from './generated-types'
import type { Payload as IdentifyPayload } from './identifyUser/generated-types'
import type { Payload as TrackPayload } from './trackEvent/generated-types'

import { RequestOptions } from '@segment/actions-core'

const baseURL = 'https://analytex.userpilot.io/'

interface RequestParams {
  url: string
  options: RequestOptions
}

export const getDeleteRequestParams = (settings: Settings, userId: string): RequestParams => {
  return {
    url: `${validateEndpoint(settings.endpoint)}v1/users`,
    options: {
      method: 'DELETE',
      json: { users: [userId] }
    }
  }
}

export const getValidationParams = (settings: Settings): RequestParams => {
  return {
    url: `${validateEndpoint(settings.endpoint)}v1/validate`,
    options: {
      method: 'GET'
    }
  }
}

export const getIdentifyRequestParams = (settings: Settings, payload: IdentifyPayload): RequestParams => {
  const { traits, userId } = payload

  return {
    url: `${validateEndpoint(settings.endpoint)}v1/identify`,
    options: {
      method: 'POST',
      json: {
        user_id: userId,
        // Transform createdAt to Userpilot reserved property
        metadata: traits
      }
    }
  }
}

export const getTrackEventParams = (settings: Settings, payload: TrackPayload): RequestParams => {
  const { userId, name, properties } = payload
  return {
    url: `${validateEndpoint(settings.endpoint)}v1/track`,
    options: {
      method: 'POST',
      json: {
        user_id: userId,
        event_name: name,
        metadata: properties
      }
    }
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
