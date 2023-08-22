import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { IntegrationError, InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import addUser from './addUser'
import removeUser from './removeUser'
import { TikTokAudiences } from './api'
import { ModifiedResponse } from '@segment/actions-core'
import { APIResponse } from './types'
import { CREATE_AUDIENCE_URL, GET_AUDIENCE_URL } from './constants'

import createAudience from './createAudience'

import addToAudience from './addToAudience'

import removeFromAudience from './removeFromAudience'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'TikTok Audiences',
  slug: 'actions-tiktok-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      advertiser_ids: {
        // TODO: Remove on cleanup
        label: 'TikTok Advertiser IDs',
        description:
          'The Advertiser IDs where audiences should be synced. Hidden in production and should not be altered by users.',
        type: 'string',
        required: false, // Make it optional so the native methods aren't expecting this.
        multiple: true
      }
    },
    testAuthentication: async (request, { auth }) => {
      if (!auth?.accessToken) {
        throw new InvalidAuthenticationError(
          'Please authenticate via Oauth before updating other settings and/or enabling the destination.'
        )
      }

      const TikTokApiClient: TikTokAudiences = new TikTokAudiences(request)

      const response: ModifiedResponse<APIResponse> = await TikTokApiClient.getUserInfo()

      // Since the API will return 200 we need to parse the response to see if it failed.

      if (response.data.code !== 0) {
        throw new Error(
          'Invalid Oauth access token. Please reauthenticate to retrieve a valid access token before updating other settings and/or enabling the destination.'
        )
      }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        'Access-Token': `${auth?.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  },
  audienceFields: {
    advertiserId: {
      type: 'string',
      label: 'Advertiser ID',
      description: 'The advertiser ID to use when syncing audiences.',
      required: true
    },
    idType: {
      type: 'string',
      label: 'ID Type',
      description:
        'Encryption type to be used for populating the audience. This field is set only when Segment creates a new audience.',
      choices: [
        { label: 'Email', value: 'EMAIL_SHA256' },
        { label: 'Google Advertising ID', value: 'GAID_SHA256' },
        { label: 'Android Advertising ID', value: 'AAID_SHA256' },
        { label: 'iOS Advertising ID', value: 'IDFA_SHA256' }
      ],
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const idType = createAudienceInput.audienceSettings?.idType
      const advertiserId = createAudienceInput.audienceSettings?.advertiserId

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!advertiserId) {
        throw new IntegrationError('Missing advertiser ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const response = await request(CREATE_AUDIENCE_URL, {
        method: 'POST',
        json: {
          custom_audience_name: audienceName,
          advertiser_id: advertiserId,
          id_type: idType,
          action: 'create'
        }
      })

      const r = await response.json()
      if (r['message'] !== 'OK') {
        // TODO: Add statsClient calls
        // statsContext?.statsClient.incr('actions-tiktok-audiences.createAudience.native', 1, statsContext?.tags)
        throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: r.data['audience_id']
      }
    },
    async getAudience(request, getAudienceInput) {
      // TODO: Add statsClient calls
      // statsContext?.statsClient.incr('actions-tiktok-audiences.getAudience.native', 1, statsContext?.tags)
      const url = new URL(GET_AUDIENCE_URL)
      const audienceIds = [getAudienceInput.externalId]
      const advertiserId = getAudienceInput.audienceSettings?.advertiserId

      if (!advertiserId) {
        throw new IntegrationError(
          'Unable to verify ownership over audience. Missing advertiserId.',
          'INVALID_REQUEST_DATA',
          400
        )
      }

      const params = new URLSearchParams()
      params.append('advertiser_id', advertiserId)
      params.append('custom_audience_ids', JSON.stringify(audienceIds))

      const response = await request(`${url.toString()}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const r = await response.json()
      if (r['message'] !== 'OK') {
        throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
      }

      const externalId = r.data['list'][0]['audience_details']['audience_id']

      if (externalId !== getAudienceInput.externalId) {
        throw new IntegrationError(
          "Unable to verify ownership over audience. Segment Audience ID doesn't match TikToks Audience ID.",
          'INVALID_REQUEST_DATA',
          400
        )
      }

      return {
        externalId: externalId
      }
    }
  },
  actions: {
    addUser,
    removeUser,
    createAudience,
    addToAudience,
    removeFromAudience
  }
}

export default destination
