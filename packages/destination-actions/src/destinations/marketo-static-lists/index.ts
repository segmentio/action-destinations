import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

import addToList from './addToList'
import removeFromList from './removeFromList'
import { MarketoListResponse, RefreshTokenResponse, GET_LIST_ENDPOINT, OAUTH_ENDPOINT } from './constants'
import { createList, formatEndpoint } from './functions'

const destination: AudienceDestinationDefinition<Settings> = {
  name: 'Marketo Static Lists (Actions)',
  slug: 'actions-marketo-static-lists',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      client_id: {
        label: 'Client ID',
        description: 'Your Marketo REST API Client ID.',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'Client Secret',
        description: 'Your Marketo REST API Client Secret.',
        type: 'password',
        required: true
      },
      api_endpoint: {
        label: 'API Endpoint',
        description: 'Your Marketo REST API Endpoint in this format: https://<your_account_id>.mktorest.com.',
        type: 'string',
        required: true
      },
      folder_name: {
        label: 'Folder Name',
        description: 'Name of the folder in which to create static lists.',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { settings }) => {
      const api_endpoint = formatEndpoint(settings.api_endpoint)
      const response = await request<RefreshTokenResponse>(`${api_endpoint}/${OAUTH_ENDPOINT}`, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: settings.client_id,
          client_secret: settings.client_secret,
          grant_type: 'client_credentials'
        })
      })

      return { accessToken: response.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  audienceFields: {},
  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule; update as necessary
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },
    async createAudience(request, createAudienceInput) {
      const listId = await createList(request, createAudienceInput, createAudienceInput.statsContext)

      return {
        externalId: listId
      }
    },
    async getAudience(request, getAudienceInput) {
      const endpoint = formatEndpoint(getAudienceInput.settings.api_endpoint)
      const listId = getAudienceInput.externalId
      const statsClient = getAudienceInput?.statsContext?.statsClient
      const statsTags = getAudienceInput?.statsContext?.tags

      const getListUrl = endpoint + GET_LIST_ENDPOINT.replace('listId', listId)

      const getListResponse = await request<MarketoListResponse>(getListUrl, {
        method: 'GET'
      })

      if (!getListResponse.data.success && getListResponse.data.errors) {
        statsClient?.incr('getAudience.error', 1, statsTags)
        throw new IntegrationError(`${getListResponse.data.errors[0].message}`, 'INVALID_RESPONSE', 400)
      }

      statsClient?.incr('getAudience.success', 1, statsTags)

      return {
        externalId: listId
      }
    }
  },
  actions: {
    addToList,
    removeFromList
  }
}

export default destination
