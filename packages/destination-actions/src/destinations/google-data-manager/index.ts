import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'

import ingest from './ingest'
import { buildHeaders, getAuthSettings, getAuthToken } from '../display-video-360/shared'
import { CREATE_AUDIENCE_URL, GET_AUDIENCE_URL } from '../display-video-360/constants'
import { handleRequestError } from '../display-video-360/errors'

export interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Google Data Manager',
  slug: 'actions-google-data-manager',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {},
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>('https://www.googleapis.com/oauth2/v4/token', {
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

  onDelete: async (_request) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    ingest
  },
  presets: [],
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const { audienceName, audienceSettings, statsContext } = createAudienceInput
      const { accountType } = audienceSettings || {}
      const advertiserId = audienceSettings?.advertiserId.trim()
      const { statsClient, tags: statsTags } = statsContext || {}
      const statsName = 'createAudience'
      statsTags?.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)

      const authSettings = getAuthSettings()

      if (!audienceName) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!advertiserId) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing advertiser ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!accountType) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing account type value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const listTypeMap = { basicUserList: {}, type: 'REMARKETING', membershipStatus: 'OPEN' }
      const partnerCreateAudienceUrl = CREATE_AUDIENCE_URL.replace('advertiserID', advertiserId).replace(
        'accountType',
        accountType
      )

      let response
      try {
        const authToken = await getAuthToken(request, authSettings)
        response = await request(partnerCreateAudienceUrl, {
          headers: buildHeaders(createAudienceInput.audienceSettings, authToken),
          method: 'POST',
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

        const r = await response?.json()
        statsClient?.incr(`${statsName}.success`, 1, statsTags)

        return {
          externalId: r['results'][0]['resourceName']
        }
      } catch (error) {
        throw handleRequestError(error, statsName, statsContext)
      }
    },
    async getAudience(request, getAudienceInput) {
      const { statsContext, audienceSettings } = getAudienceInput
      const { statsClient, tags: statsTags } = statsContext || {}
      const { accountType } = audienceSettings || {}
      const advertiserId = audienceSettings?.advertiserId.trim()
      const statsName = 'getAudience'
      statsTags?.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)

      const authSettings = getAuthSettings()

      if (!advertiserId) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing required advertiser ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!accountType) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing account type value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const advertiserGetAudienceUrl = GET_AUDIENCE_URL.replace('advertiserID', advertiserId).replace(
        'accountType',
        accountType
      )

      try {
        const authToken = await getAuthToken(request, authSettings)
        const response = await request(advertiserGetAudienceUrl, {
          headers: buildHeaders(audienceSettings, authToken),
          method: 'POST',
          json: {
            query: `SELECT user_list.name, user_list.description, user_list.membership_status, user_list.match_rate_percentage FROM user_list WHERE user_list.resource_name = "${getAudienceInput.externalId}"`
          }
        })

        const r = await response.json()

        const externalId = r[0]?.results[0]?.userList?.resourceName

        if (externalId !== getAudienceInput.externalId) {
          statsClient?.incr(`${statsName}.error`, 1, statsTags)
          throw new IntegrationError(
            "Unable to verify ownership over audience. Segment Audience ID doesn't match Googles Audience ID.",
            'INVALID_REQUEST_DATA',
            400
          )
        }

        statsClient?.incr(`${statsName}.success`, 1, statsTags)
        return {
          externalId: externalId
        }
      } catch (error) {
        throw handleRequestError(error, statsName, statsContext)
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
    accountType: {
      type: 'string',
      label: 'Account Type',
      description: 'The type of the advertiser account you have linked to this Display & Video 360 destination.',
      required: true,
      choices: [
        { label: 'Advertiser', value: 'DISPLAY_VIDEO_ADVERTISER' },
        { label: 'Partner', value: 'DISPLAY_VIDEO_PARTNER' },
        { label: 'Publisher', value: 'GOOGLE_AD_MANAGER' }
      ]
    }
  }
}

export default destination
