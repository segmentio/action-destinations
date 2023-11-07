import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

import addToList from './addToList'
import removeFromList from './removeFromList'
import {
  MarketoListResponse,
  getAccessToken,
  GET_FOLDER_ENDPOINT,
  GET_LIST_ENDPOINT,
  CREATE_LIST_ENDPOINT
} from './constants'

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
      const audienceName = createAudienceInput.audienceName
      const folder = createAudienceInput.settings.folder_name
      const endpoint = createAudienceInput.settings.api_endpoint
      const statsClient = createAudienceInput?.statsContext?.statsClient
      const statsTags = createAudienceInput?.statsContext?.tags

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      // Get access token
      const accessToken = await getAccessToken(request, createAudienceInput.settings)

      const getFolderUrl = endpoint + GET_FOLDER_ENDPOINT.replace('folderName', encodeURIComponent(folder))

      // Get folder ID by name
      const getFolderResponse = await request<MarketoListResponse>(getFolderUrl, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      // Since the API will return 200 we need to parse the response to see if it failed.
      if (!getFolderResponse.data.success && getFolderResponse.data.errors) {
        statsClient?.incr('createAudience.error', 1, statsTags)
        throw new IntegrationError(`${getFolderResponse.data.errors[0].message}`, 'INVALID_RESPONSE', 400)
      }

      if (!getFolderResponse.data.result) {
        statsClient?.incr('createAudience.error', 1, statsTags)
        throw new IntegrationError(`A folder with the name ${folder} not found`, 'INVALID_REQUEST_DATA', 400)
      }

      const folderId = getFolderResponse.data.result[0].id.toString()

      const createListUrl =
        endpoint +
        CREATE_LIST_ENDPOINT.replace('folderId', folderId).replace('listName', encodeURIComponent(audienceName))

      // Create list in given folder
      const createListResponse = await request<MarketoListResponse>(createListUrl, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      if (!createListResponse.data.success && createListResponse.data.errors) {
        statsClient?.incr('createAudience.error', 1, statsTags)
        throw new IntegrationError(`${createListResponse.data.errors[0].message}`, 'INVALID_RESPONSE', 400)
      }

      const externalId = createListResponse.data.result[0].id.toString()
      statsClient?.incr('createAudience.success', 1, statsTags)

      return {
        externalId: externalId
      }
    },
    async getAudience(request, getAudienceInput) {
      const endpoint = getAudienceInput.settings.api_endpoint
      const listId = getAudienceInput.externalId
      const statsClient = getAudienceInput?.statsContext?.statsClient
      const statsTags = getAudienceInput?.statsContext?.tags

      // Get access token
      const accessToken = await getAccessToken(request, getAudienceInput.settings)

      const getListUrl = endpoint + GET_LIST_ENDPOINT.replace('listId', listId)

      const getListResponse = await request<MarketoListResponse>(getListUrl, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
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
