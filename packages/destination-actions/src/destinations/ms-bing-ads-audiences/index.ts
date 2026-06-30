import {
  AudienceDestinationDefinition,
  InvalidAuthenticationError,
  ErrorCodes,
  IntegrationError,
  PayloadValidationError,
  HTTPError
} from '@segment/actions-core'
import type { ModifiedResponse } from '@segment/actions-core'
import type { Settings } from './generated-types'
import syncAudiences from './syncAudiences'
import { CreateAudienceRequest, CreateAudienceResponse, GetAudienceResponse, RefreshTokenResponse } from './types'
import { BASE_URL, TOKEN_URL } from './constants'
import { readResponseBody } from './utils'

const destination: AudienceDestinationDefinition<Settings> = {
  name: 'Ms Bing Ads Audiences',
  slug: 'actions-ms-bing-ads-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      customerAccountId: {
        label: 'Customer Account ID',
        description:
          'The account ID of the Microsoft Advertising account you want to manage. You can find it in the URL when viewing the account in the Microsoft Ads User Interface. Not to be confused with Account Number.',
        type: 'string',
        required: true
      },
      customerId: {
        label: 'Customer ID',
        description:
          'The customer (parent) ID associated with your Microsoft Advertising account. You can find this in the URL when viewing your account in the Microsoft Ads User Interface.',
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

      if (!res?.data?.access_token) {
        throw new InvalidAuthenticationError('Failed to refresh access token', ErrorCodes.OAUTH_REFRESH_FAILED)
      }

      return {
        accessToken: res?.data?.access_token,
        refreshToken: res?.data?.refresh_token || auth.refreshToken
      }
    }
  },

  extendRequest({ auth, settings }) {
    return {
      headers: {
        Authorization: `Bearer ${auth?.accessToken}`,
        DeveloperToken: process.env.ACTIONS_MS_BING_ADS_AUDIENCES_DEVELOPER_TOKEN || '',
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

      const json: CreateAudienceRequest = {
        Audiences: [
          {
            Name: audienceName,
            Type: 'CustomerList'
          }
        ]
      }

      let response: CreateAudienceResponse
      try {
        response = await request(`${BASE_URL}/Audiences`, {
          method: 'POST',
          json
        })
      } catch (error) {
        // The request client throws an HTTPError on a non-2xx response. Without this, the raw error
        // escapes untyped and the platform surfaces an opaque "500 / Bad Request" with no detail.
        // Capture Bing's actual status and response body so the real cause is visible in logs.
        if (error instanceof HTTPError) {
          const status = error.response?.status
          const body = await readResponseBody(error.response as ModifiedResponse)
          // Default a missing upstream status to 500 (retryable) rather than 400 — an unknown
          // status is an ambiguous failure, not a client error.
          throw new IntegrationError(
            `Failed to create audience. Microsoft Bing Ads returned HTTP ${status ?? 'unknown'}: ${
              body || 'no response body'
            }`,
            'CREATE_AUDIENCE_FAILED',
            status || 500
          )
        }
        // Non-HTTP failures (timeouts, socket/connection errors) carry no response. Surface them
        // as a retryable 500 rather than letting a raw, opaque error escape.
        throw new IntegrationError(
          `Failed to create audience. Microsoft Bing Ads request failed: ${
            (error as Error)?.message || 'unknown error'
          }`,
          'CREATE_AUDIENCE_FAILED',
          500
        )
      }

      // Bing returns a 200 with a PartialErrors array (rather than an HTTP error) for most create
      // failures, so any error code here must be surfaced explicitly — otherwise it is silently
      // swallowed and collapses into the opaque "No AudienceId returned" error below.
      if (response?.data?.PartialErrors?.length) {
        const errorObj = response.data.PartialErrors[0]

        if (errorObj?.ErrorCode === 'CustomerListTermsAndConditionsNotAccepted') {
          throw new IntegrationError(
            "The Customer Match 'Terms And Conditions' are not yet Accepted in the Microsoft Advertising web UI. Please create a Customer List in the Microsoft Advertising UI to accept the terms.",
            'TERMS_NOT_ACCEPTED',
            400
          )
        }

        // Surface every other PartialError with Bing's own ErrorCode and Message so the real cause
        // (e.g. a duplicate audience name) is visible instead of NO_AUDIENCE_ID.
        throw new IntegrationError(
          `Failed to create audience: ${errorObj?.ErrorCode ?? 'UnknownError'}: ${
            errorObj?.Message ?? 'No error message provided'
          }`,
          errorObj?.ErrorCode ?? 'CREATE_AUDIENCE_FAILED',
          400
        )
      }

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
