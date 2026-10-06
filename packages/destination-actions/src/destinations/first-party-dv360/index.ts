import {
  AudienceDestinationDefinition,
  IntegrationError,
  PayloadValidationError,
  defaultValues
} from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'
import { CREATE_DEVICE_ID_OPERATION, CREATE_OPERATION, EXISTING_OPERATION } from './properties'
import { createOrConnectAudience, getAudience } from './audience-functions'
import removeFromAudContactInfo from './removeFromAudContactInfo'
import removeFromAudMobileDeviceId from './removeFromAudMobileDeviceId'
import addToAudContactInfo from './addToAudContactInfo'
import addToAudMobileDeviceId from './addToAudMobileDeviceId'
import syncAudience from './syncAudience'
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
    operation: {
      type: 'string',
      label: 'Create or Connect Audience',
      choices: [
        { label: 'Create new audience', value: 'create' },
        { label: 'Create new audience, or connect to an existing one with the same name', value: 'create_or_connect' },
        { label: 'Connect to existing audience', value: 'existing' }
      ],
      default: 'create',
      required: false,
      description:
        'Whether Segment creates a new audience in Display & Video 360 or connects to an existing one. The "connect to an existing one with the same name" option only connects if that audience has the same Audience Type and Membership Duration Days. [Learn more](https://www.twilio.com/docs/segment/connections/destinations/catalog/actions-first-party-dv360#create-or-connect-audience).'
    },
    advertiserId: {
      type: 'string',
      label: 'Advertiser ID',
      required: true,
      description: 'The ID of your Display & Video 360 advertiser. **Required:** always.'
    },
    audienceType: {
      type: 'string',
      label: 'Audience Type',
      choices: [
        { label: 'CUSTOMER MATCH CONTACT INFO', value: 'CUSTOMER_MATCH_CONTACT_INFO' },
        { label: 'CUSTOMER MATCH DEVICE ID', value: 'CUSTOMER_MATCH_DEVICE_ID' }
      ],
      required: true,
      description:
        "The type of the audience. **Required:** always. When connecting to an existing audience, it must match that audience's type."
    },
    existingAudienceId: {
      type: 'string',
      label: 'Existing Audience ID',
      required: false,
      description:
        'The ID of an audience which already exists in Display & Video 360. **Required:** when Create or Connect Audience is "Connect to existing audience". **Not required:** for the other Create or Connect Audience options, which ignore this ID.',
      depends_on: EXISTING_OPERATION
    },
    audienceDisplayName: {
      type: 'string',
      label: 'Audience Display Name',
      required: false,
      description:
        'The name of the audience in Display & Video 360. **Optional:** when creating a new audience; defaults to the Segment audience name. Must be unique per advertiser; see Create or Connect Audience for what happens if it already exists. **Not required:** when connecting to an existing audience (ignored).',
      depends_on: CREATE_OPERATION
    },
    description: {
      type: 'string',
      label: 'Description',
      required: false,
      description:
        'The description of the audience. **Optional:** when creating a new audience. **Not required:** when connecting to an existing audience (ignored).',
      depends_on: CREATE_OPERATION
    },
    appId: {
      type: 'string',
      label: 'App ID',
      required: false,
      description:
        'The app ID matching the mobile device IDs being uploaded. **Optional:** when creating a new CUSTOMER_MATCH_DEVICE_ID audience. **Not required:** for CUSTOMER_MATCH_CONTACT_INFO audiences, or when connecting to an existing audience, including one with the same name (ignored).',
      depends_on: CREATE_DEVICE_ID_OPERATION
    },
    membershipDurationDays: {
      type: 'string',
      label: 'Membership Duration Days',
      required: false,
      description:
        'Days an entry remains in the audience, from 1 to 540. **Required:** when creating a new audience. **Not required:** when connecting to an existing audience (ignored).',
      depends_on: CREATE_OPERATION
    }
  },

  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },

    createAudience: async (_request, _CreateAudienceInput: _CreateAudienceInput) => {
      // Extract values from input
      const {
        audienceName,
        audienceSettings: {
          operation,
          advertiserId,
          audienceType,
          audienceDisplayName,
          existingAudienceId,
          membershipDurationDays,
          description,
          appId
        } = {},
        settings: { oauth: auth } = {},
        statsContext,
        features
      } = _CreateAudienceInput

      const recordOAuthErrorStat = (reason: string) => {
        const tags = [...(statsContext?.tags ?? []), `slug:${destination.slug}`]
        statsContext?.statsClient?.incr('createAudience.call', 1, tags)
        statsContext?.statsClient?.incr('createAudience.error', 1, [...tags, 'error:oauth', `reason:${reason}`])
      }

      if (
        !auth?.refresh_token ||
        !process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_ID ||
        !process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_SECRET
      ) {
        recordOAuthErrorStat('oauth-credentials-missing')
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
      }).catch((error) => {
        recordOAuthErrorStat('oauth-token-request-failed')
        throw error
      })

      const token = res.data.access_token

      const { audienceId } = await createOrConnectAudience(
        _request,
        {
          operation: operation === 'existing' || operation === 'create_or_connect' ? operation : 'create',
          advertiserId,
          audienceName: audienceDisplayName?.trim() || audienceName,
          audienceType,
          membershipDurationDays,
          description,
          appId,
          existingAudienceId
        },
        { statsName: 'createAudience', token, features, statsContext }
      )

      return { externalId: audienceId }
    },

    getAudience: async (_request, _GetAudienceInput: _GetAudienceInput) => {
      // Extract values from input
      const { audienceSettings, statsContext, features } = _GetAudienceInput
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

      try {
        const audience = await getAudience(_request, { advertiserId, audienceId, token, features, statsContext })
        statsClient?.incr(`${statsName}.success`, 1, statsTags)
        return { externalId: audience.firstPartyAndPartnerAudienceId as string }
      } catch (error) {
        statsTags?.push('error:api-request-failed')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw error
      }
    }
  },

  actions: {
    addToAudContactInfo,
    addToAudMobileDeviceId,
    removeFromAudContactInfo,
    removeFromAudMobileDeviceId,
    syncAudience
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
      name: 'Associated Entity Added',
      partnerAction: 'addToAudContactInfo',
      mapping: defaultValues(addToAudContactInfo.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_added_track'
    },
    {
      name: 'Associated Entity Removed',
      partnerAction: 'removeFromAudContactInfo',
      mapping: defaultValues(removeFromAudContactInfo.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_removed_track'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'addToAudContactInfo',
      mapping: defaultValues(addToAudContactInfo.fields),
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    },
    {
      name: 'Journey Step All Events',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'journey_step_all_events_track'
    }
  ]
}

export default destination
