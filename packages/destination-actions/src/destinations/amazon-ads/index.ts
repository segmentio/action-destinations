import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { InvalidAuthenticationError, IntegrationError, ErrorCodes } from '@segment/actions-core'
import type { RefreshTokenResponse, AmazonRefreshTokenError, AmazonTestAuthenticationError } from './types'
import type { Settings, AudienceSettings } from './generated-types'
import { AudiencePayload, AUTHORIZATION_URL, CURRENCY } from './utils'

import syncAudiences from './syncAudiences'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Amazon Ads',
  slug: 'actions-amazon-ads',
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
          method: 'GET'
        })
      } catch (e: any) {
        const error = e as AmazonTestAuthenticationError
        if (error.message === 'Unauthorized') {
          throw new Error(
            'Invalid Amazon Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
          )
        }
        throw e
      }
    },
    refreshAccessToken: async (request, { auth, settings }) => {
      const endpoint = AUTHORIZATION_URL[`${settings.region}`]
      try {
        const res = await request<RefreshTokenResponse>(endpoint, {
          method: 'POST',
          body: new URLSearchParams({
            refresh_token: auth.refreshToken,
            client_id: auth.clientId,
            client_secret: auth.clientSecret,
            grant_type: 'refresh_token'
          }),
          headers: {
            // Amazon ads refresh token API throws error with authorization header so explicity overriding Authorization header here.
            authorization: ''
          }
        })

        return { accessToken: res.data.access_token }
      } catch (e: any) {
        const error = e as AmazonRefreshTokenError
        if (error.response?.data?.error === 'invalid_grant') {
          throw new IntegrationError(
            `Invalid Authentication: Your refresh token is invalid or expired. Please re-authenticate to fetch a new refresh token.`,
            ErrorCodes.REFRESH_TOKEN_EXPIRED,
            401
          )
        }

        throw new IntegrationError(
          `Failed to fetch a new access token. Reason: ${error.response?.data?.error}`,
          ErrorCodes.OAUTH_REFRESH_FAILED,
          401
        )
      }
    }
  },

  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'Amazon-Advertising-API-ClientID': process.env.ACTIONS_AMAZON_ADS_CLIENT_ID || '',
        'Content-Type': 'application/vnd.amcaudiences.v1+json'
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
      type: 'string',
      description: `Cost per thousand impressions (CPM) in cents. For example, $1.00 = 100 cents.`
    },
    currency: {
      label: 'Currency',
      type: 'string',
      description: `The price paid. Base units depend on the currency. As an example, USD should be reported as Dollars.Cents, whereas JPY should be reported as a whole number of Yen. All provided values will be rounded to two digits with toFixed(2).Refer [Aamzon Ads Documentation](https://advertising.amazon.com/API/docs/en-us/amc-advertiser-audience#tag/Audience-Metadata/operation/CreateAudienceMetadataV2) to view supported Currency`
    },
    ttl: {
      type: 'string',
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
      const { audienceName, audienceSettings } = createAudienceInput
      const endpoint = createAudienceInput.settings.region
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
        const timeToLive = Number(ttl)
        if (!timeToLive) {
          throw new IntegrationError('TTL:-String can not be converted to Number', 'INVALID_TTL_VALUE', 400)
        }
        payload.metadata.ttl = timeToLive
      }

      if (cpm_cents && currency) {
        if (!CURRENCY.includes(currency)) {
          throw new IntegrationError('Invalid Currency Value', 'INVALID_CURRENCY_VALUE', 400)
        }
        const cpmCents = Number(cpm_cents)
        if (!cpmCents) {
          throw new IntegrationError('CPM_CENTS:-String can not be converted to Number', 'INVALID_CPMCENTS_VALUE', 400)
        }
        payload.metadata.audienceFees = []
        payload.metadata?.audienceFees.push({
          currency,
          cpmCents: cpmCents
        })
      }

      let payloadString = JSON.stringify(payload)

      // Regular expression to find a numeric string that should be a number
      const regex = /"advertiserId":"(\d+)"/
      // Replace the string with an unquoted number
      payloadString = payloadString.replace(regex, '"advertiserId":$1')

      const response = await request(`${endpoint}/amc/audiences/metadata`, {
        method: 'POST',
        body: payloadString,
        headers: {
          'Content-Type': 'application/vnd.amcaudiences.v1+json'
        }
      })

      const res = await response.text()
      //Replace the Big Int number with quoted String
      const resString = res.replace(/"audienceId":(\d+)/, '"audienceId":"$1"')

      const externalId = JSON.parse(resString)['audienceId']
      return {
        externalId
      }
    },
    async getAudience(request, getAudienceInput) {
      // getAudienceInput.externalId represents audience ID that was created in createAudience
      const audience_id = getAudienceInput.externalId
      const endpoint = getAudienceInput.settings.region

      if (!audience_id) {
        throw new IntegrationError('Missing audienceId value', 'MISSING_REQUIRED_FIELD', 400)
      }
      const response = await request(`${endpoint}/amc/audiences/metadata/${audience_id}`, {
        method: 'GET'
      })
      const res = await response.text()
      //Replace the Big Int number with quoted String
      const resString = res.replace(/"audienceId":(\d+)/, '"audienceId":"$1"')
      const externalId = JSON.parse(resString)['audienceId']
      return {
        externalId
      }
    }
  },
  actions: {
    syncAudiences
  }
}

export default destination
