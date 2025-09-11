import { AudienceDestinationDefinition, GlobalSetting, IntegrationError, RequestClient } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'
import syncUserData from './syncUserData'
import { buildHeaders, getAuthSettings, getAuthToken } from './shared'
import { CREATE_AUDIENCE_URL, GET_AUDIENCE_URL, SEGMENT_DATA_PARTNER_ID } from './constants'
import { handleRequestError } from './errors'
import { verifyCustomerId } from './functions'

export interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

const testAuthUrl = `https://audiencepartner.googleapis.com/v2/products/DATA_PARTNER/customers/${SEGMENT_DATA_PARTNER_ID}/audiencePartner:searchStream`

const audienceFields: Record<string, GlobalSetting> = {
  product: {
    label: 'Product',
    description: 'The product for which you want to create or manage audiences.',
    type: 'string',
    required: true,
    choices: [
      { label: 'Google Ads', value: 'GOOGLE_ADS' },
      { label: 'Display & Video 360', value: 'DISPLAY_VIDEO_ADVERTISER' }
    ]
  },
  productDestinationId: {
    label: 'Product Destination ID',
    description:
      'The ID of the product destination, used to identify the specific destination for audience management.',
    type: 'string',
    required: true
  },
  externalIdType: {
    type: 'string',
    label: 'External ID Type',
    description: 'Customer match upload key types. Required if you are using UserLists. Not used by the other actions.',
    choices: [
      { label: 'CONTACT INFO', value: 'CONTACT_INFO' },
      { label: 'CRM ID', value: 'CRM_ID' },
      { label: 'MOBILE ADVERTISING ID', value: 'MOBILE_ADVERTISING_ID' }
    ]
  },
  app_id: {
    label: 'App ID',
    description:
      'A string that uniquely identifies a mobile application from which the data was collected. Required if external ID type is mobile advertising ID',
    type: 'string',
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'external_id_type',
          operator: 'is',
          value: 'MOBILE_ADVERTISING_ID'
        }
      ]
    }
  },
  description: {
    type: 'string',
    label: 'Description',
    required: false,
    description: 'The description of the audience.'
  },
  membershipDurationDays: {
    type: 'string',
    label: 'Membership Duration Days',
    required: true,
    description:
      'The duration in days that an entry remains in the audience after the qualifying event. If the audience has no expiration, set the value of this field to 10000. Otherwise, the set value must be greater than 0 and less than or equal to 540.'
  }
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Google Data Manager',
  slug: 'actions-google-data-manager',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      advertiserAccountId: {
        label: 'Advertiser Account ID',
        description: 'The ID of the advertiser in Google Product.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { auth, settings }) => {
      const accessToken = auth.accessToken
      if (!accessToken) throw new Error('Missing access token for authentication test.')
      const response = await request(testAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'login-customer-id': settings.advertiserAccountId
        },
        body: JSON.stringify({
          query: `SELECT product_link.google_ads.google_ads_customer FROM product_link WHERE product_link.google_ads.google_ads_customer = 'products/GOOGLE_ADS/customers/${settings.advertiserAccountId}'`
        })
      })
      if (response.status < 200 || response.status >= 300)
        throw new Error('Authentication failed: ' + response.statusText)
      return response
    },
    refreshAccessToken: async (request, { auth }) => {
      const res = await refreshAccessTokenRequest(request, auth)
      const data = await res.json()
      return { accessToken: data.access_token }
    }
  },
  extendRequest({ auth }) {
    return { headers: { authorization: `Bearer ${auth?.accessToken}` } }
  },

  actions: { syncUserData },

  audienceConfig: {
    mode: { type: 'synced', full_audience_sync: false },
    async createAudience(request, { audienceName, settings, statsContext, audienceSettings }) {
      const advertiserId = settings?.advertiserAccountId.trim()
      const { statsClient, tags: statsTags = [] } = statsContext || {}
      const statsName = 'createAudience'
      statsTags.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)
      if (!audienceName) {
        statsTags.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      verifyCustomerId(advertiserId)

      // TODO: Multiple calls to different endpoints for different products
      const partnerCreateAudienceUrl = CREATE_AUDIENCE_URL.replace('advertiserID', advertiserId)
      const listTypeMap = { basicUserList: {}, type: 'REMARKETING', membershipStatus: 'OPEN' }
      try {
        const authToken = await getAuthToken(request, getAuthSettings())
        const response = await request(partnerCreateAudienceUrl, {
          headers: buildHeaders(audienceSettings, settings, authToken),
          method: 'POST',
          json: {
            operations: [
              {
                create: {
                  ...listTypeMap,
                  name: audienceName,
                  description: audienceSettings?.description || 'Created by Segment',
                  membershipLifeSpan: audienceSettings?.membershipDurationDays
                }
              }
            ]
          }
        })

        const r = await response?.json()
        statsClient?.incr(`${statsName}.success`, 1, statsTags)
        return { externalId: r['results'][0]['resourceName'] }
      } catch (error) {
        throw handleRequestError(error, statsName, statsContext)
      }
    },
    async getAudience(request, { statsContext, settings, audienceSettings, externalId }) {
      const { statsClient, tags: statsTags = [] } = statsContext || {}
      const advertiserId = settings?.advertiserAccountId.trim()
      const statsName = 'getAudience'
      statsTags.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)
      if (!advertiserId) {
        statsTags.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing required advertiser ID value', 'MISSING_REQUIRED_FIELD', 400)
      }
      const advertiserGetAudienceUrl = GET_AUDIENCE_URL.replace('advertiserID', advertiserId)
      try {
        const authToken = await getAuthToken(request, getAuthSettings())
        const response = await request(advertiserGetAudienceUrl, {
          headers: buildHeaders(audienceSettings, settings, authToken),
          method: 'POST',
          json: {
            query: `SELECT user_list.name, user_list.description, user_list.membership_status, user_list.match_rate_percentage FROM user_list WHERE user_list.resource_name = "${externalId}"`
          }
        })
        const r = await response.json()
        const foundId = r[0]?.results[0]?.userList?.resourceName
        if (foundId !== externalId) {
          statsClient?.incr(`${statsName}.error`, 1, statsTags)
          throw new IntegrationError(
            "Unable to verify ownership over audience. Segment Audience ID doesn't match Googles Audience ID.",
            'INVALID_REQUEST_DATA',
            400
          )
        }
        statsClient?.incr(`${statsName}.success`, 1, statsTags)
        return { externalId: foundId }
      } catch (error) {
        throw handleRequestError(error, statsName, statsContext)
      }
    }
  },
  audienceFields
}

function refreshAccessTokenRequest(
  request: RequestClient,
  auth: { refreshToken: string; clientId: string; clientSecret: string }
) {
  return request('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: auth.refreshToken,
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      grant_type: 'refresh_token'
    })
  })
}

export default destination
