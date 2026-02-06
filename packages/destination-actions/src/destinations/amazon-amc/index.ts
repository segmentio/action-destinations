import {
  AudienceDestinationDefinition,
  InvalidAuthenticationError,
  PayloadValidationError,
  defaultValues
} from '@segment/actions-core'
import {
  RefreshTokenResponse,
  AmazonTestAuthenticationError,
  AudiencePayload,
  DSPTargetResource,
  AMCTargetResource
} from './types'
import type { Settings, AudienceSettings } from './generated-types'
import { extractNumberAndSubstituteWithStringValue, getAuthToken } from './utils'
import { SYNC_TO, REGEX_AUDIENCEID, REGEX_ADVERTISERID, TTL_MAX_VALUE } from './constants'
import syncAudiencesToDSP from './syncAudiencesToDSP'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Amazon Ads DSP and AMC',
  slug: 'actions-amazon-amc',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      region: {
        label: 'Region',
        description: 'Region for API Endpoint, either NA, EU, FE.',
        choices: [
          { label: 'North America (NA)', value: 'https://advertising-api.amazon.com' },
          { label: 'Europe (EU)', value: 'https://advertising-api-eu.amazon.com' },
          { label: 'Far East (FE)', value: 'https://advertising-api-fe.amazon.com' }
        ],
        default: 'https://advertising-api.amazon.com',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { auth, settings }) => {
      if (!auth?.accessToken) {
        throw new InvalidAuthenticationError('Please authenticate via Oauth before enabling the destination.')
      }

      try {
        await request<RefreshTokenResponse>(`${settings.region}/${AMAZON_AMC_AUTH_API_VERSION}/profiles`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        })
      } catch (e: any) {
        const error = e as AmazonTestAuthenticationError
        if (error.message === 'Unauthorized') {
          throw new InvalidAuthenticationError(
            'Invalid Amazon Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
          )
        }
        throw e
      }
    },
    refreshAccessToken: async (request, { auth, settings }) => {
      const authToken = await getAuthToken(request, settings, auth)
      return { accessToken: authToken }
    }
  },

  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'Amazon-Advertising-API-ClientID': process.env.ACTIONS_AMAZON_AMC_CLIENT_ID || ''
      }
    }
  },

  audienceFields: {
    syncTo: {
      type: 'string',
      label: 'Sync To',
      required: false,
      description: 'Chose whether to sync audience to DSP or AMC. Defaults to DSP.',
      choices: [
        { label: 'DSP', value: SYNC_TO.DSP },
        { label: 'AMC', value: SYNC_TO.AMC }
      ],
      default: SYNC_TO.DSP
    },
    description: {
      type: 'string',
      label: 'Description',
      required: true,
      description:
        'The audience description. Must be an alphanumeric, non-null string between 0 to 1000 characters in length.'
    },
    countryCode: {
      type: 'string',
      label: 'Country Code',
      required: true,
      description: 'A String value representing ISO 3166-1 alpha-2 country code for the members in this audience.'
    },
    externalAudienceId: {
      type: 'string',
      label: 'External Audience Id',
      required: true,
      description: 'The user-defined audience identifier.'
    },
    cpmCents: {
      label: 'CPM Cents',
      type: 'number',
      description: `Cost per thousand impressions (CPM) in cents. For example, $1.00 = 100 cents.`
    },
    currency: {
      label: 'Currency',
      type: 'string',
      description: `Currency code for the CPM value.`,
      choices: [
        { value: 'USD', label: 'USD' },
        { value: 'CAD', label: 'CAD' },
        { value: 'JPY', label: 'JPY' },
        { value: 'GBP', label: 'GBP' },
        { value: 'EUR', label: 'EUR' },
        { value: 'SAR', label: 'SAR' },
        { value: 'AUD', label: 'AUD' },
        { value: 'AED', label: 'AED' },
        { value: 'CNY', label: 'CNY' },
        { value: 'MXN', label: 'MXN' },
        { value: 'INR', label: 'INR' },
        { value: 'SEK', label: 'SEK' },
        { value: 'TRY', label: 'TRY' }
      ],
      default: ''
    },
    ttl: {
      type: 'number',
      label: 'Time-to-live',
      required: false,
      description: 'Time-to-live in seconds. The amount of time the record is associated with the audience.'
    },
    //As per the discussion, for now taking `advertiserId` in `audienceFields` as user can create multiple audiences within a single instance of destination.
    advertiserId: {
      label: 'Advertiser ID',
      description: 'Advertiser ID when when syncing an Audience to Amazon Ads DSP',
      type: 'string'
    },
    amcInstanceId: {
      label: 'AMC Instance ID',
      description: 'AMC Instance ID used when syncing an audience to Amazon Marketing Cloud (AMC)',
      type: 'string'
    },
    amcAccountId: {
      label: 'AMC Account ID',
      description: 'AMC Account ID used when syncing an audience to Amazon Marketing Cloud (AMC)',
      type: 'string'
    },
    amcAccountMarketplaceId: {
      label: 'AMC Account Marketplace ID',
      description: 'AMC Account Marketplace ID used when syncing an audience to Amazon Marketing Cloud (AMC)',
      type: 'string'
    }
  },

  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule; update as necessary
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },
    async createAudience(request, createAudienceInput) {
      const { audienceName, audienceSettings, settings } = createAudienceInput
      const endpoint = settings.region

      const {
        syncTo = SYNC_TO.DSP,
        description,
        advertiserId,
        externalAudienceId,
        countryCode,
        ttl,
        currency,
        cpmCents,
        amcInstanceId,
        amcAccountId,
        amcAccountMarketplaceId
      } = audienceSettings || {}

      if (syncTo === SYNC_TO.DSP && !advertiserId) {
        throw new PayloadValidationError('Advertiser Id value is required when syncing an audience to DSP')
      }

      if (syncTo === SYNC_TO.AMC && (!amcInstanceId || !amcAccountId || !amcAccountMarketplaceId)) {
        throw new PayloadValidationError(
          'AMC Instance Id, AMC Account Id and AMC Account Marketplace Id value are required when syncing audience to AMC'
        )
      }

      if (!description) {
        throw new PayloadValidationError('Missing description Value')
      }

      if (!externalAudienceId) {
        throw new PayloadValidationError('Missing externalAudienceId Value')
      }

      if (!audienceName) {
        throw new PayloadValidationError('Missing audienceName Value')
      }

      if (!countryCode) {
        throw new PayloadValidationError('Missing countryCode Value')
      }

      if (ttl && ttl > TTL_MAX_VALUE) {
        throw new PayloadValidationError(`TTL must have value less than or equal to ${TTL_MAX_VALUE}`)
      }

      let connectionId: string | undefined = undefined
      if (syncTo === SYNC_TO.AMC) {
        const payloadStringConnsAPI = JSON.stringify({ amcInstanceId, amcAccountId, amcAccountMarketplaceId })
        const response = await request(`${endpoint}/amc/audiences/connections`, {
          method: 'POST',
          body: payloadStringConnsAPI,
          headers: {
            'Content-Type': 'application/vnd.amcaudiencesconnections.v1+json'
          }
        })

        connectionId = JSON.parse(await response.text())?.connectionId
        if (!connectionId) {
          throw new PayloadValidationError(
            'Unable to fetch connectionId with given AMC amcInstanceId amcAccountId and amcAccountMarketplaceId details'
          )
        }
      }

      const payload: AudiencePayload = {
        name: audienceName,
        description,
        targetResource: (() => {
          if (syncTo === SYNC_TO.AMC) {
            const targetResource: AMCTargetResource = {
              amcInstanceId: amcInstanceId as string,
              amcAccountId: amcAccountId as string,
              amcAccountMarketplaceId: amcAccountMarketplaceId as string,
              connectionId: connectionId as string
            }
            return targetResource
          }
          if (syncTo === SYNC_TO.DSP) {
            const targetResource: DSPTargetResource = {
              advertiserId: advertiserId as string
            }
            return targetResource
          }
          throw new PayloadValidationError('Invalid syncTo value')
        })(),
        metadata: {
          externalAudienceId
        },
        countryCode
      }

      if (ttl) {
        payload.metadata.ttl = ttl
      }

      if (cpmCents && currency) {
        payload.metadata.audienceFees = []
        payload.metadata?.audienceFees.push({
          currency,
          cpmCents
        })
      }

      let payloadString = JSON.stringify(payload)
      // Regular expression to find a advertiserId numeric string and replace the quoted advertiserId string with an unquoted number
      // AdvertiserId is very big number string and can not be assigned or converted to number directly as it changes the value due to integer overflow.
      if (syncTo === SYNC_TO.DSP) {
        payloadString = payloadString.replace(REGEX_ADVERTISERID, '"advertiserId":$1')
      }

      const response = await request(`${endpoint}/amc/audiences/metadata`, {
        method: 'POST',
        body: payloadString,
        headers: {
          'Content-Type': 'application/vnd.amcaudiences.v1+json'
        },
        timeout: 15000
      })

      const res = await response.text()
      // Regular expression to find a audienceId number and replace the audienceId with quoted string
      const resp = extractNumberAndSubstituteWithStringValue(res, REGEX_AUDIENCEID, '"audienceId":"$1"')
      return {
        externalId: syncTo === SYNC_TO.DSP ? resp.audienceId : resp.audienceId + ':' + connectionId
      }
    },

    async getAudience(request, getAudienceInput) {
      // getAudienceInput.externalId represents audience ID that was created in createAudience
      const audience_id = getAudienceInput.externalId.split(':')[0]
      const { settings } = getAudienceInput
      const endpoint = settings.region
      if (!audience_id) {
        throw new PayloadValidationError('Missing audienceId value')
      }
      const response = await request(`${endpoint}/amc/audiences/metadata/${audience_id}`, {
        method: 'GET',
        timeout: 15000
      })
      const res = await response.text()
      // Regular expression to find a audienceId number and replace the audienceId with quoted string
      const resp = extractNumberAndSubstituteWithStringValue(res, REGEX_AUDIENCEID, '"audienceId":"$1"')
      return {
        externalId: resp.audienceId
      }
    }
  },
  actions: {
    syncAudiencesToDSP
  },
  presets: [
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'syncAudiencesToDSP',
      mapping: {
        ...defaultValues(syncAudiencesToDSP.fields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_membership_changed_identify'
    },
    {
      name: 'Associated Entity Added',
      partnerAction: 'syncAudiencesToDSP',
      mapping: defaultValues(syncAudiencesToDSP.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_added_track'
    },
    {
      name: 'Associated Entity Removed',
      partnerAction: 'syncAudiencesToDSP',
      mapping: defaultValues(syncAudiencesToDSP.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_removed_track'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'syncAudiencesToDSP',
      mapping: {
        ...defaultValues(syncAudiencesToDSP.fields)
      },
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

export default destination
