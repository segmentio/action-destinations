import type { Settings } from './generated-types'
import type { Payload as IdentifyPayload } from './identifyUser/generated-types'
import type { Payload as TrackPayload } from './trackEvent/generated-types'
import type { Payload as GroupPayload } from './identifyCompany/generated-types'

import { RequestOptions } from '@segment/actions-core'
import { USERPILOT_API_VERSION } from '../versioning-info'

const baseURL = 'https://analytex.userpilot.io/'

interface RequestParams {
  url: string
  options: RequestOptions
}

export const getDeleteRequestParams = (settings: Settings, userId: string): RequestParams => {
  return {
    url: `${validateEndpoint(settings.endpoint)}${USERPILOT_API_VERSION}/users`,
    options: {
      method: 'DELETE',
      json: { users: [userId] }
    }
  }
}

export const getValidationParams = (settings: Settings): RequestParams => {
  return {
    url: `${validateEndpoint(settings.endpoint)}${USERPILOT_API_VERSION}/validate`,
    options: {
      method: 'GET'
    }
  }
}

export const getIdentifyRequestParams = (settings: Settings, payload: IdentifyPayload): RequestParams => {
  const { traits, userId } = payload

  return {
    url: `${validateEndpoint(settings.endpoint)}${USERPILOT_API_VERSION}/identify`,
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
export const getCompanyIdentifyRequestParams = (settings: Settings, payload: GroupPayload): RequestParams => {
  const { traits, groupId } = payload

  return {
    url: `${validateEndpoint(settings.endpoint)}${USERPILOT_API_VERSION}/companies/identify`,
    options: {
      method: 'POST',
      json: {
        company_id: groupId,
        metadata: traits
      }
    }
  }
}

export const getTrackEventParams = (settings: Settings, payload: TrackPayload): RequestParams => {
  const { userId, name, properties } = payload
  return {
    url: `${validateEndpoint(settings.endpoint)}${USERPILOT_API_VERSION}/track`,
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
