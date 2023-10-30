import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'

import addToAudience from './addToAudience'
import removeFromAudience from './removeFromAudience'

import { CREATE_AUDIENCE_URL, GET_AUDIENCE_URL } from './constants'
import { buildListTypeMap } from './listManagement'

interface RefreshTokenResponse {
  access_token: string
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Display and Video 360 (Actions)',
  slug: 'actions-display-video-360',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      //Fields is required, so this is left empty
    },
    refreshAccessToken: async (request, { auth }) => {
      const { data } = await request<RefreshTokenResponse>('https://accounts.google.com/o/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })
      return { accessToken: data.access_token }
    }
  },
  extendRequest({ auth }) {
    // TODO: extendRequest doesn't work within createAudience and getAudience
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  audienceFields: {
    advertiserId: {
      type: 'string',
      label: 'Advertiser ID',
      required: true,
      description:
        'The ID of your advertiser, used throughout Display & Video 360. Use this ID when you contact Display & Video 360 support to help our teams locate your specific account.'
    },
    listType: {
      type: 'string',
      label: 'List Type',
      description: 'The type of audience list you want to create.',
      required: true,
      choices: [
        { label: 'Basic User List', value: 'basicUserList' },
        { label: 'Customer Match List', value: 'customerMatchList' }
      ]
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: true
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const advertiserId = createAudienceInput.audienceSettings?.advertiserId
      const listType = createAudienceInput.audienceSettings?.listType
      const statsClient = createAudienceInput?.statsContext?.statsClient
      const statsTags = createAudienceInput?.statsContext?.tags

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!advertiserId) {
        throw new IntegrationError('Missing advertiser ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!listType) {
        throw new IntegrationError('Missing list type value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const listTypeMap = buildListTypeMap(listType)
      const partnerCreateAudienceUrl = CREATE_AUDIENCE_URL.replace('advertiserID', advertiserId)
      let response
      try {
        response = await request(partnerCreateAudienceUrl, {
          method: 'POST',
          headers: {
            // 'Authorization': `Bearer ${authToken}`, // TODO: Replace with auth token
            'Content-Type': 'application/json',
            'Login-Customer-Id': `products/DISPLAY_VIDEO_ADVERTISER/customers/${advertiserId}`
          },
          json: {
            operations: [
              {
                create: {
                  ...listTypeMap,
                  name: audienceName,
                  description: 'Created by Segment',
                  membershipLifeSpan: '540'
                }
              }
            ]
          }
        })
      } catch (error) {
        const errorMessage = await JSON.parse(error.response.content).error.details[0].errors[0].message
        statsClient?.incr('createAudience.error', 1, statsTags)
        throw new IntegrationError(errorMessage, 'INVALID_RESPONSE', 400)
      }

      const r = await response.json()
      statsClient?.incr('createAudience.success', 1, statsTags)

      return {
        externalId: r['results'][0]['resourceName']
      }
    },
    async getAudience(request, getAudienceInput) {
      const statsClient = getAudienceInput?.statsContext?.statsClient
      const statsTags = getAudienceInput?.statsContext?.tags
      const advertiserId = getAudienceInput.audienceSettings?.advertiserId

      if (!advertiserId) {
        throw new IntegrationError('Missing required advertiser ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const advertiserGetAudienceUrl = GET_AUDIENCE_URL.replace('advertiserID', advertiserId)
      const response = await request(advertiserGetAudienceUrl, {
        headers: {
          // 'Authorization': `Bearer ${authToken}`, // TODO: Replace with auth token
          'Content-Type': 'application/json',
          'Login-Customer-Id': `products/DISPLAY_VIDEO_ADVERTISER/customers/${advertiserId}`
        },
        method: 'POST',
        json: {
          query: `SELECT user_list.name, user_list.description, user_list.membership_status, user_list.match_rate_percentage FROM user_list WHERE user_list.resource_name = "${getAudienceInput.externalId}"`
        }
      })

      const r = await response.json()

      if (response.status !== 200) {
        statsClient?.incr('getAudience.error', 1, statsTags)
        throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
      }

      const externalId = r[0]?.results[0]?.userList?.resourceName

      if (externalId !== getAudienceInput.externalId) {
        throw new IntegrationError(
          "Unable to verify ownership over audience. Segment Audience ID doesn't match Googles Audience ID.",
          'INVALID_REQUEST_DATA',
          400
        )
      }

      statsClient?.incr('getAudience.success', 1, statsTags)
      return {
        externalId: externalId
      }
    }
  },
  actions: {
    addToAudience,
    removeFromAudience
  }
}

export default destination
