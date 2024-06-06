import {
  IntegrationError,
  AudienceDestinationDefinition,
  PayloadValidationError,
  APIError
} from '@segment/actions-core'
import type { Settings } from './generated-types'

import { API_URL } from './config'
import upsertProfile from './upsertProfile'
import addProfileToList from './addProfileToList'
import removeProfileFromList from './removeProfileFromList'
import trackEvent from './trackEvent'
import orderCompleted from './orderCompleted'
import subscribeProfile from './subscribeProfile'
import { buildHeaders } from './functions'
import removeProfile from './removeProfile'

import unsubscribeProfile from './unsubscribeProfile'

const destination: AudienceDestinationDefinition<Settings> = {
  name: 'Klaviyo (Actions)',
  slug: 'actions-klaviyo',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        type: 'password',
        label: 'API Key',
        description: `You can find this by going to Klaviyo's UI and clicking Account > Settings > API Keys > Create API Key`,
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`${API_URL}/accounts/`, {
        method: 'get'
      })
    }
  },

  onDelete: async (request, { payload }) => {
    return request(`${API_URL}/data-privacy-deletion-jobs/`, {
      method: 'post',
      json: {
        data: {
          type: 'data-privacy-deletion-job',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                id: payload.userId
              }
            }
          }
        }
      }
    })
  },

  extendRequest({ settings }) {
    return {
      headers: buildHeaders(settings.api_key)
    }
  },
  audienceFields: {},
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const apiKey = createAudienceInput.settings.api_key
      if (!audienceName) {
        throw new PayloadValidationError('Missing audience name value')
      }

      if (!apiKey) {
        throw new PayloadValidationError('Missing Api Key value')
      }

      const response = await request(`${API_URL}/lists`, {
        method: 'POST',
        headers: buildHeaders(apiKey),
        json: {
          data: { type: 'list', attributes: { name: audienceName } }
        }
      })
      const r = await response.json()
      return {
        externalId: r.data.id
      }
    },
    async getAudience(request, getAudienceInput) {
      const listId = getAudienceInput.externalId
      const apiKey = getAudienceInput.settings.api_key
      const response = await request(`${API_URL}/lists/${listId}`, {
        method: 'GET',
        headers: buildHeaders(apiKey),
        throwHttpErrors: false
      })

      if (!response.ok) {
        const errorResponse = await response.json()
        const klaviyoErrorDetail = errorResponse.errors[0].detail
        throw new APIError(klaviyoErrorDetail, response.status)
      }

      const r = await response.json()
      const externalId = r.data.id

      if (externalId !== getAudienceInput.externalId) {
        throw new IntegrationError(
          "Unable to verify ownership over audience. Segment Audience ID doesn't match The Klaviyo List Id.",
          'INVALID_REQUEST_DATA',
          400
        )
      }

      return {
        externalId
      }
    }
  },
  actions: {
    upsertProfile,
    addProfileToList,
    removeProfileFromList,
    trackEvent,
    orderCompleted,
    subscribeProfile,
    unsubscribeProfile,
    removeProfile
  }
}

export default destination
