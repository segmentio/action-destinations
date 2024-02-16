import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'

import type { Settings, AudienceSettings } from './generated-types'
import type { RefreshTokenResponse } from './types'

import addToAudience from './addToAudience'
import removeFromAudience from './removeFromAudience'

import { CREATE_AUDIENCE_URL, GET_AUDIENCE_URL, OAUTH_URL } from './constants'
import { buildHeaders, getAuthToken, getAuthSettings, isLegacyDestinationMigration } from './shared'
import { handleRequestError } from './errors'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Display and Video 360 (Actions)',
  slug: 'actions-display-video-360',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {}, // Fields is required. Left empty on purpose.
    refreshAccessToken: async (request, { auth }) => {
      const { data } = await request<RefreshTokenResponse>(OAUTH_URL, {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: process.env.ACTIONS_DISPLAY_VIDEO_360_REFRESH_TOKEN as string,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })
      return { accessToken: data.access_token }
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
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const { audienceName, audienceSettings, statsContext, settings } = createAudienceInput
      const { advertiserId, accountType } = audienceSettings || {}
      const { statsClient, tags: statsTags } = statsContext || {}
      const statsName = 'createAudience'
      statsTags?.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)

      // @ts-ignore - TS doesn't know about the oauth property
      const authSettings = getAuthSettings(settings)

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
      const { statsContext, audienceSettings, settings } = getAudienceInput
      const { statsClient, tags: statsTags } = statsContext || {}
      const { advertiserId, accountType } = audienceSettings || {}
      const statsName = 'getAudience'
      statsTags?.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)

      // @ts-ignore - TS doesn't know about the oauth property
      const authSettings = getAuthSettings(settings)

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

      // Legacy destinations don't have an auth object until customers log-in to the new destination.
      // However, the bulkUploader API doesn't require an auth object, so we can use the externalId to verify ownership.
      // Only legacy destinations will have an externalId and no auth object.
      if (isLegacyDestinationMigration(getAudienceInput, authSettings)) {
        statsClient?.incr(`${statsName}.legacy`, 1, statsTags)

        return {
          externalId: getAudienceInput.externalId
        }
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
  actions: {
    addToAudience,
    removeFromAudience
  }
}

export default destination
