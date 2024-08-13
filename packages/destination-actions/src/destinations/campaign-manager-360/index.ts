import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import conversionUpload from './conversionUpload'
import { CampaignManager360RefreshTokenResponse } from './types'

import conversionAdjustmentUpload from './conversionAdjustmentUpload'

const destination: DestinationDefinition<Settings> = {
  name: 'Campaign Manager 360',
  slug: 'campaign-manager-360',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      profileId: {
        label: 'Profile ID',
        description: 'The ID of the Campaign Manager 360 profile you want to use.',
        type: 'string',
        required: true
      },
      defaultFloodlightActivityId: {
        label: 'Default Floodlight Activity ID',
        description:
          'The Default Floodlight activity ID associated with all the mappings. Can be overridden in the mapping.',
        type: 'string',
        required: false
      },
      defaultFloodlightConfigurationId: {
        label: 'Default Floodlight Configuration ID',
        description:
          'The Default Floodlight configuration ID associated with all the mappings. Can be overridden in the mapping.',
        type: 'string',
        required: false
      }
    },
    testAuthentication: (_request) => {
      // For now not necessary.
      return true
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<CampaignManager360RefreshTokenResponse>('https://www.googleapis.com/oauth2/v4/token', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  actions: {
    conversionUpload,
    conversionAdjustmentUpload
  }
}

export default destination
