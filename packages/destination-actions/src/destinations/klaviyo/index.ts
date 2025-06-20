import {
  IntegrationError,
  AudienceDestinationDefinition,
  PayloadValidationError,
  APIError,
  defaultValues,
  InvalidAuthenticationError
} from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'

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

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Klaviyo (Actions)',
  slug: 'actions-klaviyo',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      api_key: {
        type: 'password',
        label: 'API Key',
        description: `You can find this by going to Klaviyo's UI and clicking Account > Settings > API Keys > Create API Key`,
        required: false
      }
    },
    testAuthentication: (request, { auth }) => {
      if (!auth.accessToken) {
        throw new InvalidAuthenticationError('Please authenticate via Oauth before enabling the destination.')
      }
      return request(`${API_URL}/accounts/`, {
        method: 'get'
      })
    },
    refreshAccessToken: async (request, { auth }) => {
      const endpoint = 'https://a.klaviyo.com/oauth/token'
      try {
        const response = await request(endpoint, {
          method: 'POST',
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: auth.refreshToken,
            client_id: auth.clientId,
            client_secret: auth.clientSecret
          }).toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        const jsonResponse = await response.json()
        // Optionally log the response using console.log or another logger if available
        console.info('Klaviyo refresh access token response:', jsonResponse)
        return jsonResponse
      } catch (error) {
        console.log('Klaviyo refresh access token error:', error)
        if (error instanceof APIError && error.status == 400) {
          throw new InvalidAuthenticationError(
            'Invalid Klaviyo Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
          )
        }
      }
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

  extendRequest({ settings, auth }) {
    return {
      headers: buildHeaders(settings.api_key, auth?.accessToken)
    }
  },
  audienceFields: {
    listId: {
      label: 'List Id',
      description: `The default List ID to subscribe users to. This list takes precedence over the new list segment auto creates when attaching this destination to an audience.`,
      type: 'string'
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const defaultAudienceId = createAudienceInput.audienceSettings?.listId

      if (defaultAudienceId) {
        return { externalId: defaultAudienceId }
      }

      if (!audienceName) {
        throw new PayloadValidationError('Missing audience name value')
      }
      const response = await request(`${API_URL}/lists`, {
        method: 'POST',
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
      const defaultAudienceId = getAudienceInput.audienceSettings?.listId

      if (defaultAudienceId) {
        getAudienceInput.externalId = defaultAudienceId
      }

      const listId = getAudienceInput.externalId

      const response = await request(`${API_URL}/lists/${listId}`, {
        method: 'GET',
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
  },
  presets: [
    {
      name: 'Entities Audience Entered',
      partnerAction: 'addProfileToList',
      mapping: defaultValues(addProfileToList.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_entered_track'
    },
    {
      name: 'Entities Audience Exited',
      partnerAction: 'removeProfileFromList',
      mapping: defaultValues(removeProfileFromList.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_exited_track'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'addProfileToList',
      mapping: defaultValues(addProfileToList.fields),
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

export default destination
