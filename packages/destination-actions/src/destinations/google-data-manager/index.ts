import { AudienceDestinationDefinition, GlobalSetting, IntegrationError } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'
import syncUserData from './syncUserData'
import { buildHeaders } from './shared'
import { CREATE_AUDIENCE_URL, GET_AUDIENCE_URL, PRODUCT_LINK_SEARCH_URL, SEGMENT_DATA_PARTNER_ID } from './constants'
import { handleRequestError } from './errors'
import { verifyCustomerId } from './functions'
import { getDataPartnerToken } from './data-partner-token'

const testAuthUrl = `https://audiencepartner.googleapis.com/v2/products/DATA_PARTNER/customers/${SEGMENT_DATA_PARTNER_ID}/audiencePartner:searchStream`

const audienceFields: Record<string, GlobalSetting> = {
  advertiserAccountId: {
    label: 'Advertiser Account ID',
    description: 'The ID of the advertiser in Google Product.',
    type: 'string',
    required: true
  },
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
    required: false,
    description:
      'The duration in days that an entry remains in the audience after the qualifying event. If the audience has no expiration, set the value of this field to 10000. Otherwise, the set value must be greater than 0 and less than or equal to 540.'
  }
}

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Google Data Manager',
  slug: 'actions-google-data-manager',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {},
    testAuthentication: async () => {
      return true
    }
  },

  actions: { syncUserData },

  audienceConfig: {
    mode: { type: 'synced', full_audience_sync: false },
    async createAudience(request, { audienceName, settings, statsContext, audienceSettings }) {
      let advertiserId = audienceSettings?.advertiserAccountId.trim()
      const { statsClient, tags: statsTags = [] } = statsContext || {}
      const statsName = 'createAudience'
      statsTags.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)
      if (!audienceName) {
        statsTags.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      advertiserId = verifyCustomerId(advertiserId)

      if (audienceSettings == null || !audienceSettings.product) {
        throw new IntegrationError('Missing product value', 'MISSING_REQUIRED_FIELD', 400)
      }
      // check if product link exists for given advertiser id
      // https://developers.google.com/audience-partner/api/reference/rest/v2/products.customers.audiencePartner/searchStream?hl=en
      const response = await request(testAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getDataPartnerToken()}`,
          'login-customer-id': audienceSettings.advertiserAccountId
        },
        body: JSON.stringify({
          query: PRODUCT_LINK_SEARCH_URL.replace('productLower', audienceSettings.product.toLowerCase()) //todo: check link for each of the products
            .replace('productUpper', audienceSettings.product.toUpperCase())
            .replace('advertiserID', advertiserId)
        })
      })
      if (response.status < 200 || response.status >= 300)
        throw new IntegrationError(
          'Failed to fetch product link: ' + response.statusText,
          'MISSING_REQUIRED_FIELD',
          400
        )

      // assert response has product link
      const responseJson = await response.json()
      if (!Array.isArray(responseJson) || !responseJson[0]?.results?.[0]?.productLink?.resourceName) {
        throw new IntegrationError('Expected productLink in response', 'MISSING_REQUIRED_FIELD', 400)
      }

      //todo: do we want to create product link here if it doesn't exist?
      // https://developers.google.com/audience-partner/api/reference/rest/v2/products.customers.productLinks/create?hl=en

      // TODO: Multiple calls to different endpoints for different products
      try {
        let partnerCreateAudienceUrl
        if (audienceSettings?.product != null) {
          partnerCreateAudienceUrl = CREATE_AUDIENCE_URL.replace('advertiserID', advertiserId).replace(
            'productName',
            audienceSettings?.product
          )
        } else {
          throw new IntegrationError('Missing product value', 'MISSING_REQUIRED_FIELD', 400)
        }
        const listTypeMap = { basicUserList: {}, type: 'REMARKETING', membershipStatus: 'OPEN' }
        const response = await request(partnerCreateAudienceUrl, {
          headers: buildHeaders(audienceSettings, settings, await getDataPartnerToken()),
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
      const advertiserId = audienceSettings?.advertiserAccountId?.trim()
      const statsName = 'getAudience'
      statsTags.push(`slug:${destination.slug}`)
      statsClient?.incr(`${statsName}.call`, 1, statsTags)
      if (!advertiserId) {
        statsTags.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing required advertiser ID value', 'MISSING_REQUIRED_FIELD', 400)
      }
      // TODO : How to return external audience ID for multiple products?
      if (audienceSettings === undefined) {
        statsTags.push('error:missing-settings')
        statsClient?.incr(`${statsName}.error`, 1, statsTags)
        throw new IntegrationError('Missing audience settings', 'MISSING_REQUIRED_FIELD', 400)
      }
      const advertiserGetAudienceUrl = GET_AUDIENCE_URL.replace('advertiserID', advertiserId).replace(
        'productName',
        audienceSettings.product
      )
      try {
        const response = await request(advertiserGetAudienceUrl, {
          headers: buildHeaders(audienceSettings, settings, await getDataPartnerToken()),
          method: 'POST',
          json: {
            query: `SELECT user_list.name, user_list.description, user_list.membership_status, user_list.match_rate_percentage
            FROM user_list WHERE user_list.resource_name = "${externalId}"`
          }
        })
        const r = await response.json()
        const foundId = r[0]?.results[0]?.userList?.resourceName
        if (foundId === undefined) {
          statsTags.push('error:not-found')
          statsClient?.incr(`${statsName}.error`, 1, statsTags)
          throw new IntegrationError('Audience not found', 'MISSING_REQUIRED_FIELD', 400)
        }
        if (foundId !== externalId) {
          statsTags.push('error:id-mismatch')
          statsClient?.incr(`${statsName}.error`, 1, statsTags)
          throw new IntegrationError(
            "Unable to verify ownership over audience. Segment Audience ID doesn't match Google's Audience ID.",
            'INVALID_REQUEST_DATA',
            400
          )
        }
        statsClient?.incr(`${statsName}.success`, 1, statsTags)
        return { externalId: foundId }
      } catch (error) {
        if (error instanceof IntegrationError) {
          throw error
        }
        throw handleRequestError(error, statsName, statsContext)
      }
    }
  },
  audienceFields
}

export default destination
