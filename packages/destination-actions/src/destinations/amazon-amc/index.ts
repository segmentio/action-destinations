import {
  AudienceDestinationDefinition,
  InvalidAuthenticationError,
  IntegrationError,
  defaultValues
} from '@segment/actions-core'
import type { RefreshTokenResponse, AmazonTestAuthenticationError } from './types'
import type { Settings, AudienceSettings } from './generated-types'
import {
  AudiencePayload,
  extractNumberAndSubstituteWithStringValue,
  getAuthToken,
  REGEX_ADVERTISERID,
  REGEX_AUDIENCEID,
  TTL_MAX_VALUE
} from './utils'

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
        await request<RefreshTokenResponse>(`${settings.region}/v2/profiles`, {
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
      description: 'Advertiser Id',
      type: 'string',
      required: true
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
      const description = audienceSettings?.description
      const advertiser_id = audienceSettings?.advertiserId
      const external_audience_id = audienceSettings?.externalAudienceId
      const country_code = audienceSettings?.countryCode
      const ttl = audienceSettings?.ttl
      const currency = audienceSettings?.currency
      const cpm_cents = audienceSettings?.cpmCents

      if (!advertiser_id) {
        throw new IntegrationError('Missing advertiserId Value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!description) {
        throw new IntegrationError('Missing description Value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!external_audience_id) {
        throw new IntegrationError('Missing externalAudienceId Value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!audienceName) {
        throw new IntegrationError('Missing audienceName Value', 'MISSING_REQUIRED_FIELD', 400)
      }
      if (!country_code) {
        throw new IntegrationError('Missing countryCode Value', 'MISSING_REQUIRED_FIELD', 400)
      }
      if (ttl && ttl > TTL_MAX_VALUE) {
        throw new IntegrationError(`TTL must have value less than or equal to ${TTL_MAX_VALUE}`, 'INVALID_INPUT', 400)
      }

      const payload: AudiencePayload = {
        name: audienceName,
        description: description,
        targetResource: {
          advertiserId: advertiser_id
        },
        metadata: {
          externalAudienceId: external_audience_id
        },
        countryCode: country_code
      }

      if (ttl) {
        payload.metadata.ttl = ttl
      }

      if (cpm_cents && currency) {
        payload.metadata.audienceFees = []
        payload.metadata?.audienceFees.push({
          currency,
          cpmCents: cpm_cents
        })
      }

      let payloadString = JSON.stringify(payload)
      // Regular expression to find a advertiserId numeric string and replace the quoted advertiserId string with an unquoted number
      // AdvertiserId is very big number string and can not be assigned or converted to number directly as it changes the value due to integer overflow.
      payloadString = payloadString.replace(REGEX_ADVERTISERID, '"advertiserId":$1')

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
        externalId: resp.audienceId
      }
    },

    async getAudience(request, getAudienceInput) {
      // getAudienceInput.externalId represents audience ID that was created in createAudience
      const audience_id = getAudienceInput.externalId
      const { settings } = getAudienceInput
      const endpoint = settings.region
      if (!audience_id) {
        throw new IntegrationError('Missing audienceId value', 'MISSING_REQUIRED_FIELD', 400)
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
