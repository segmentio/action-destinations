import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

import addToList from './addToList'
import removeFromList from './removeFromList'
import { MarketoResonse, getAccessToken } from './constants'

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
      return { accessToken: await getAccessToken(request, settings) }
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
      const audience_name = createAudienceInput.audienceName
      const folder = createAudienceInput.settings.folder_name
      const endpoint = createAudienceInput.settings.api_endpoint
      const statsClient = createAudienceInput?.statsContext?.statsClient
      const statsTags = createAudienceInput?.statsContext?.tags

      // Get access token
      // const access_token = await getAccessToken(request, createAudienceInput.settings)

      // Get folder ID by name
      const get_folder_response = await request<MarketoResonse>(
        `${endpoint}/rest/asset/v1/folder/byName.json?name=${encodeURIComponent(folder)}`,
        {
          method: 'GET'
          // headers: {
          //   authorization: `Bearer ${access_token}`
          // }
        }
      )

      // Since the API will return 200 we need to parse the response to see if it failed.
      if (!get_folder_response.data.success && get_folder_response.data.errors) {
        statsClient?.incr('createAudience.error', 1, statsTags)
        throw new IntegrationError(`${get_folder_response.data.errors[0].message}`, 'INVALID_RESPONSE', 400)
      }

      if (!get_folder_response.data.result) {
        statsClient?.incr('createAudience.error', 1, statsTags)
        throw new IntegrationError(`A folder with the name ${folder} not found`, 'INVALID_REQUEST_DATA', 400)
      }

      const folder_id = get_folder_response.data.result[0].id

      // Create list in given folder
      const create_list_response = await request<MarketoResonse>(
        `${endpoint}/rest/asset/v1/staticLists.json?folder=${folder_id}&name=${encodeURIComponent(audience_name)}`,
        {
          method: 'POST'
          // headers: {
          //   authorization: `Bearer ${access_token}`
          // }
        }
      )

      if (!create_list_response.data.success && create_list_response.data.errors) {
        statsClient?.incr('createAudience.error', 1, statsTags)
        throw new IntegrationError(`${create_list_response.data.errors[0].message}`, 'INVALID_RESPONSE', 400)
      }

      const external_id = create_list_response.data.result[0].id.toString()
      if (external_id) {
        statsClient?.incr('createAudience.success', 1, statsTags)
      }

      return {
        externalId: external_id
      }
    },
    async getAudience(request, getAudienceInput) {
      const endpoint = getAudienceInput.settings.api_endpoint
      const list_id = getAudienceInput.externalId
      const statsClient = getAudienceInput?.statsContext?.statsClient
      const statsTags = getAudienceInput?.statsContext?.tags

      // Get access token
      // const access_token = await getAccessToken(request, getAudienceInput.settings)

      const response = await request<MarketoResonse>(`${endpoint}/rest/asset/v1/staticList/${list_id}.json`, {
        method: 'GET'
        // headers: {
        //   authorization: `Bearer ${access_token}`
        // }
      })

      if (!response.data.success && response.data.errors) {
        statsClient?.incr('getAudience.error', 1, statsTags)
        throw new IntegrationError(`${response.data.errors[0].message}`, 'INVALID_RESPONSE', 400)
      }

      statsClient?.incr('getAudience.success', 1, statsTags)

      return {
        externalId: list_id
      }
    }
  },
  actions: {
    addToList,
    removeFromList
  }
}

export default destination
