import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { defaultValues, IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

import addToList from './addToList'
import removeFromList from './removeFromList'
import { MarketoListResponse, GET_LIST_ENDPOINT } from './constants'
import { createList, formatEndpoint, getAccessToken } from './functions'

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
  },
  presets: [
    {
      name: 'Entities Audience Entered',
      partnerAction: 'addToList',
      mapping: { ...defaultValues(addToList.fields) },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_entered_track'
    },
    {
      name: 'Entities Audience Exited',
      partnerAction: 'removeFromList',
      mapping: defaultValues(removeFromList.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_exited_track'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'addToList',
      mapping: { ...defaultValues(addToList.fields) },
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

export default destination
