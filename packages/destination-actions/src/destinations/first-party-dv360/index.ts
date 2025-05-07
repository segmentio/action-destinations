import {
  AudienceDestinationDefinition,
  IntegrationError,
  PayloadValidationError,
  defaultValues
} from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'
import { createAudienceRequest, getAudienceRequest } from './functions'
import removeFromAudContactInfo from './removeFromAudContactInfo'
import removeFromAudMobileDeviceId from './removeFromAudMobileDeviceId'
import addToAudContactInfo from './addToAudContactInfo'
import addToAudMobileDeviceId from './addToAudMobileDeviceId'
import { _CreateAudienceInput, _GetAudienceInput } from './types'

export interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'First Party Dv360',
  slug: 'actions-first-party-dv360',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {},
    testAuthentication: async (_request) => {
      return true
    },
    refreshAccessToken: async (request, { auth }) => {
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
  audienceFields: {
    advertiserId: {
      type: 'string',
      label: 'Advertiser ID',
      required: true,
      description:
        'The ID of your advertiser, used throughout Display & Video 360. Use this ID when you contact Display & Video 360 support to help our teams locate your specific account.'
    },
    audienceType: {
      type: 'string',
      label: 'Audience Type',
      choices: [
        { label: 'CUSTOMER MATCH CONTACT INFO', value: 'CUSTOMER_MATCH_CONTACT_INFO' },
        { label: 'CUSTOMER MATCH DEVICE ID', value: 'CUSTOMER_MATCH_DEVICE_ID' }
      ],
      required: true,
      description: 'The type of the audience.'
    },
    description: {
      type: 'string',
      label: 'Description',
      required: false,
      description: 'The description of the audience.'
    },
    appId: {
      type: 'string',
      label: 'App ID',
      required: false,
      description:
        'The appId matches with the type of the mobileDeviceIds being uploaded. **Required for CUSTOMER_MATCH_DEVICE_ID Audience Types.**'
    },
    membershipDurationDays: {
      type: 'string',
      label: 'Membership Duration Days',
      required: true,
      description:
        'The duration in days that an entry remains in the audience after the qualifying event. If the audience has no expiration, set the value of this field to 10000. Otherwise, the set value must be greater than 0 and less than or equal to 540.'
    }
  },

  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },

    createAudience: async (_request, _CreateAudienceInput: _CreateAudienceInput) => {
      // Extract values from input
      const { audienceName, audienceSettings, statsContext } = _CreateAudienceInput
      const auth = _CreateAudienceInput.settings.oauth
      const advertiserId = audienceSettings?.advertiserId?.trim()
      const description = audienceSettings?.description
      const membershipDurationDays = audienceSettings?.membershipDurationDays
      const audienceType = audienceSettings?.audienceType
      const appId = audienceSettings?.appId

      // Update statistics tags and sends a call metric to Datadog. Ensures that datadog is infomred 'createAudience' operation was invoked
      const statsName = 'createAudience'
      const { statsClient, tags: statsTags } = statsContext || {}
      statsTags?.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)

      // Validate required fields and throws errors if any are missing.
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

      if (!membershipDurationDays) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing membership duration days value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!audienceType) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing audience type value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (
        !auth?.refresh_token ||
        !process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_ID ||
        !process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_SECRET
      ) {
        throw new PayloadValidationError('Oauth credentials missing.')
      }

      const res = await _request<RefreshTokenResponse>('https://www.googleapis.com/oauth2/v4/token', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refresh_token,
          client_id: process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_ID,
          client_secret: process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_SECRET,
          grant_type: 'refresh_token'
        })
      })

      const token = res.data.access_token

      // Make API request to create the audience
      const response = await createAudienceRequest(_request, {
        advertiserId,
        audienceName,
        description,
        membershipDurationDays,
        audienceType,
        appId,
        token
      })

      // Parse and return the externalId
      const r = await response.json()
      statsClient?.incr(`${statsName}.success`, 1, statsTags)
      return {
        externalId: r.firstAndThirdPartyAudienceId
      }
    },

    getAudience: async (_request, _GetAudienceInput: _GetAudienceInput) => {
      // Extract values from input
      const { audienceSettings, statsContext } = _GetAudienceInput
      const auth = _GetAudienceInput.settings.oauth
      const audienceId = _GetAudienceInput.externalId
      const advertiserId = audienceSettings?.advertiserId?.trim()

      // Update statistics tags and sends a call metric to Datadog. Ensures that datadog is infomred 'getAudience' operation was invoked
      const statsName = 'getAudience'
      const { statsClient, tags: statsTags } = statsContext || {}
      statsTags?.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)

      //Get access token
      if (
        !auth?.refresh_token ||
        !process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_ID ||
        !process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_SECRET
      ) {
        throw new PayloadValidationError('Oauth credentials missing.')
      }

      const res = await _request<RefreshTokenResponse>('https://www.googleapis.com/oauth2/v4/token', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refresh_token,
          client_id: process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_ID,
          client_secret: process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_SECRET,
          grant_type: 'refresh_token'
        })
      })

      const token = res.data.access_token

      if (!advertiserId) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing required advertiser ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!audienceId) {
        statsTags?.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Failed to retrieve audience ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      // Make API request to get audience details
      const response = await getAudienceRequest(_request, { advertiserId, audienceId, token })

      if (!response.ok) {
        // Handle non-OK responses
        statsTags?.push('error:api-request-failed')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Failed to retrieve audience details', 'API_REQUEST_FAILED', response.status)
      }

      // Parse and return the response
      const audienceData = await response.json()
      statsClient?.incr(`${statsName}.success`, 1, statsTags)
      return {
        externalId: audienceData.firstAndThirdPartyAudienceId
      }
    }
  },

  actions: {
    addToAudContactInfo,
    addToAudMobileDeviceId,
    removeFromAudContactInfo,
    removeFromAudMobileDeviceId
  },
  presets: [
    {
      name: 'Entities Audience Entered',
      partnerAction: 'addToAudContactInfo',
      mapping: defaultValues(addToAudContactInfo.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_entered_track'
    },
    {
      name: 'Entities Audience Exited',
      partnerAction: 'removeFromAudContactInfo',
      mapping: defaultValues(removeFromAudContactInfo.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_exited_track'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'addToAudContactInfo',
      mapping: defaultValues(addToAudContactInfo.fields),
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

export default destination
