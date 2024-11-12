import type { DestinationDefinition } from '@segment/actions-core'
import { InvalidAuthenticationError, IntegrationError, ErrorCodes } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { LinkedInConversions } from './api'
import type { LinkedInTestAuthenticationError, RefreshTokenResponse, LinkedInRefreshTokenError } from './types'
import { LINKEDIN_API_VERSION } from './constants'
import https from 'https'
import streamConversion from './streamConversion'

const destination: DestinationDefinition<Settings> = {
  name: 'LinkedIn Conversions API',
  slug: 'actions-linkedin-conversions',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {},
    testAuthentication: async (request, { auth }) => {
      if (!auth?.accessToken) {
        throw new InvalidAuthenticationError('Please authenticate via Oauth before enabling the destination.')
      }

      const linkedinApiClient: LinkedInConversions = new LinkedInConversions(request)

      try {
        // GET the current user's id from LinkedIn's profile API: https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api?context=linkedin%2Fcompliance%2Fcontext&view=li-lms-unversioned&preserve-view=true#request
        // We request `r_basicprofile` scope when a user oauths into LinkedIn, so we retrieve the "Basic Profile Fields": https://learn.microsoft.com/en-us/linkedin/shared/references/v2/profile/basic-profile
        return await linkedinApiClient.getProfile()
      } catch (e: any) {
        const error = e as LinkedInTestAuthenticationError
        if (error.message === 'Unauthorized') {
          throw new Error(
            'Invalid LinkedIn Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
          )
        }
        throw e
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      let res

      if (!process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_ID) {
        throw new IntegrationError(`Missing client ID`, ErrorCodes.OAUTH_REFRESH_FAILED, 500)
      }

      if (!process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_SECRET) {
        throw new IntegrationError(`Missing client secret`, ErrorCodes.OAUTH_REFRESH_FAILED, 500)
      }

      if (!auth?.refreshToken) {
        throw new IntegrationError(
          `Missing refresh token. Please re-authenticate to fetch a new refresh token.`,
          ErrorCodes.OAUTH_REFRESH_FAILED,
          401
        )
      }

      try {
        res = await request<RefreshTokenResponse>('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            refresh_token: auth.refreshToken,
            client_id: process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_ID,
            client_secret: process.env.ACTIONS_LINKEDIN_CONVERSIONS_CLIENT_SECRET,
            grant_type: 'refresh_token'
          })
        })
      } catch (e: any) {
        const error = e as LinkedInRefreshTokenError
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

      return { accessToken: res?.data?.access_token }
    }
  },
  extendRequest({ auth }) {
    // Repeat calls to the same LinkedIn API endpoint were failing due to a `socket hang up`.
    // This seems to fix it: https://stackoverflow.com/questions/62500011/reuse-tcp-connection-with-node-fetch-in-node-js
    // Copied from LinkedIn Audiences extendRequest, which also ran into this issue.
    const agent = new https.Agent({ keepAlive: true })

    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'X-Restli-Protocol-Version': `2.0.0`
      },
      agent
    }
  },
  actions: {
    streamConversion
  }
}

export default destination
