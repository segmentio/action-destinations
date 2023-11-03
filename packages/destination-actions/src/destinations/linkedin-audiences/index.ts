import type { DestinationDefinition } from '@segment/actions-core'
import { InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import updateAudience from './updateAudience'
import { LINKEDIN_API_VERSION } from './constants'
import https from 'https'
import { LinkedInAudiences } from './api'
import type {
  RefreshTokenResponse,
  ProfileAPIResponse,
  AdAccountUserResponse,
  LinkedInRefreshTokenError,
  LinkedInTestAuthenticationError
} from './types'
import type { ModifiedResponse } from '@segment/actions-core'
import { IntegrationError, ErrorCodes } from '@segment/actions-core'

const destination: DestinationDefinition<Settings> = {
  // We  need to match `name` with the creationName in the db. The name used in the UI is "LinkedIn Audiences".
  name: 'Linkedin Audiences',
  slug: 'actions-linkedin-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      ad_account_id: {
        label: 'LinkedIn Ad Account Id',
        description:
          'The id of the LinkedIn Ad Account where batches should be synced. You can find your Ad Account id in your [LinkedIn Campaign Manager](https://www.linkedin.com/campaignmanager/login).',
        type: 'string',
        required: true
      },
      send_email: {
        label: 'Send Email',
        description:
          'Whether to send `email` to LinkedIn. This setting applies to all mappings you create in this destination instance.',
        type: 'boolean',
        default: true,
        required: true
      },
      send_google_advertising_id: {
        label: 'Send Google Advertising ID',
        description:
          'Whether to send Google Advertising ID to LinkedIn. This setting applies to all mappings you create in this destination instance.',
        type: 'boolean',
        default: true,
        required: true
      }
    },
    testAuthentication: async (request, { settings, auth }) => {
      if (!auth?.accessToken) {
        throw new InvalidAuthenticationError(
          'Please authenticate via Oauth before updating other settings and/or enabling the destination.'
        )
      }

      if (!settings.send_email && !settings.send_google_advertising_id) {
        throw new Error('At least one of `Send Email` or `Send Google Advertising ID` must be set to `true`.')
      }

      const linkedinApiClient: LinkedInAudiences = new LinkedInAudiences(request)

      let firstRes: ModifiedResponse<ProfileAPIResponse>

      try {
        // GET the current user's id from LinkedIn's profile API: https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api?context=linkedin%2Fcompliance%2Fcontext&view=li-lms-unversioned&preserve-view=true#request
        // We request `r_basicprofile` scope when a user oauths into LinkedIn, so we retrieve the "Basic Profile Fields": https://learn.microsoft.com/en-us/linkedin/shared/references/v2/profile/basic-profile
        firstRes = await linkedinApiClient.getProfile()
      } catch (e: any) {
        const error = e as LinkedInTestAuthenticationError
        if (error.message === 'Unauthorized') {
          throw new Error(
            'Invalid LinkedIn Oauth access token. Please reauthenticate to retrieve a valid access token before updating other settings and/or enabling the destination.'
          )
        }
        throw e
      }

      const userId = firstRes?.data?.id

      let secondRes: ModifiedResponse<AdAccountUserResponse>

      try {
        // GET the current user's permissions for this specific Ad Account: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/account-structure/create-and-manage-account-users?view=li-lms-2022-09&tabs=http#get-ad-account-user
        // If the user's role is VIEWER, then they won't have adequate permission to send batch updates to any DMP Segment audience in this LinkedIn account.
        secondRes = await linkedinApiClient.getAdAccountUserProfile(settings, userId)
      } catch (e: any) {
        const error = e as LinkedInTestAuthenticationError
        if (error.message === 'Not Found') {
          throw new Error(
            'Invalid LinkedIn Ad Account id. Please verify that the LinkedIn Ad Account exists and that you have access to it.'
          )
        }
        throw e
      }

      const userRole = secondRes?.data.role

      if (userRole === 'VIEWER') {
        throw new Error(
          'Access to the provided Ad Account with a role other than Viewer is required. Please reach out to a LinkedIn Ad Account Admin on your team to grant proper access.'
        )
      }

      return true
    },
    refreshAccessToken: async (request, { auth }) => {
      let res

      try {
        res = await request<RefreshTokenResponse>('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          body: new URLSearchParams({
            refresh_token: auth.refreshToken,
            client_id: auth.clientId,
            client_secret: auth.clientSecret,
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
    const agent = new https.Agent({ keepAlive: true })

    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'LinkedIn-Version': LINKEDIN_API_VERSION
      },
      agent
    }
  },

  actions: {
    updateAudience
  }
}

export default destination
