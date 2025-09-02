import { IntegrationError, PayloadValidationError, AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import syncAudiences from './syncAudiences'
import { CreateAudienceResponse, GetAudienceResponse, RefreshTokenResponse } from './types'
import { BASE_URL, TOKEN_URL } from './constants'

const destination: AudienceDestinationDefinition<Settings> = {
  name: 'Bing Ads Audiences',
  slug: 'actions-bing-ads-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      developerToken: {
        label: 'Developer Token',
        description:
          'The developer token for authenticating API requests. You can find it in the Microsoft Advertising UI under Settings → Developer Settings.',
        type: 'string',
        required: true
      },
      customerAccountId: {
        label: 'Customer Account ID',
        description:
          'The account ID of the Microsoft Advertising account you want to manage. You can find it in the URL when viewing the account in the Microsoft Ads UI.',
        type: 'string',
        required: true
      },
      customerId: {
        label: 'Customer ID',
        description:
          'The customer (parent) ID associated with your Microsoft Advertising account. You can also find this in the URL when viewing your account in the Microsoft Ads UI.',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      // API Docs
      // https://learn.microsoft.com/en-us/advertising/guides/authentication-oauth-get-tokens?view=bingads-13#refresh-accesstoken
      const res = await request<RefreshTokenResponse>(TOKEN_URL, {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token',
          scope: 'https://ads.microsoft.com/msads.manage offline_access'
        })
      })

      return {
        accessToken: res?.data?.access_token,
        refreshToken: res?.data?.refresh_token
      }
    }
  },

  extendRequest({ auth, settings }) {
    return {
      headers: {
        Authorization: `Bearer ${auth?.accessToken}`,
        DeveloperToken: settings?.developerToken,
        CustomerAccountId: settings?.customerAccountId,
        CustomerId: settings?.customerId
      }
    }
  },

  audienceFields: {},

  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    createAudience: async (request, createAudienceInput) => {
      // API Docs
      // Add Audience: https://learn.microsoft.com/en-us/advertising/campaign-management-service/addaudiences?view=bingads-13&tabs=prod&pivots=rest
      // Customer List: https://learn.microsoft.com/en-us/advertising/campaign-management-service/customerlist?view=bingads-13&tabs=json
      const audienceName = createAudienceInput?.audienceName

      if (!audienceName) {
        throw new PayloadValidationError('Missing audience name value')
      }

      const response: CreateAudienceResponse = await request(`${BASE_URL}/Audiences`, {
        method: 'POST',
        json: {
          Audiences: [
            {
              Name: audienceName,
              Type: 'CustomerList'
            }
          ]
        }
      })

      // Handle Terms and Conditions error from Bing Ads API
      if (response?.data?.PartialErrors?.length) {
        const errorObj = response.data.PartialErrors[0]
        if (errorObj?.ErrorCode === 'CustomerListTermsAndConditionsNotAccepted') {
          throw new IntegrationError(
            "The Customer Match 'Terms And Conditions' are not yet Accepted in the Microsoft Advertising web UI. Please create a Customer List in the Microsoft Advertising UI to accept the terms.",
            'TERMS_NOT_ACCEPTED',
            400
          )
        }
      }

      // Extract the created audience ID
      const audienceId = response?.data?.AudienceIds?.[0]
      if (!audienceId) {
        throw new IntegrationError('Failed to create audience: No AudienceId returned', 'NO_AUDIENCE_ID', 400)
      }

      return { externalId: audienceId }
    },
    getAudience: async (request, getAudienceInput) => {
      // API Docs
      // https://learn.microsoft.com/en-us/advertising/campaign-management-service/getaudiencesbyids?view=bingads-13&tabs=prod&pivots=rest
      const audienceId = getAudienceInput?.externalId
      const response: GetAudienceResponse = await request(`${BASE_URL}/Audiences/QueryByIds`, {
        method: 'POST',
        json: {
          AudienceIds: [audienceId],
          Type: 'CustomerList'
        }
      })

      return { externalId: response?.data?.Audiences?.[0]?.Id }
    }
  },

  actions: {
    syncAudiences
  }
}

export default destination
