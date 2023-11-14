import { IntegrationError, AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import { API_URL, REVISION_DATE } from './config'
import upsertProfile from './upsertProfile'
import addProfileToList from './addProfileToList'
import removeProfileFromList from './removeProfileFromList'
import trackEvent from './trackEvent'
import orderCompleted from './orderCompleted'

const destination: AudienceDestinationDefinition<Settings> = {
  name: 'Klaviyo (Actions)',
  slug: 'actions-klaviyo',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        type: 'string',
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
      headers: {
        Authorization: `Klaviyo-API-Key ${settings.api_key}`,
        Accept: 'application/json',
        revision: REVISION_DATE,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
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
      const apiKey = createAudienceInput.settings?.api_key
      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!apiKey) {
        throw new IntegrationError('Missing Api Key value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const response = await request(`${API_URL}/lists`, {
        method: 'POST',
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`
        },
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
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`
        }
      })

      if (response.status !== 200) {
        throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
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
    orderCompleted
  }
}

export default destination
