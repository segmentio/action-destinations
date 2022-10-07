import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import updateAudience from './updateAudience'
import { LINKEDIN_API_VERSION } from './linkedin-properties'
import https from 'https'

interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

interface ProfileAPIResponse {
  id: string
}

interface AdAccountUserResponse {
  role: string
}

const destination: DestinationDefinition<Settings> = {
  // We  need to match `name` with the creationName in the db.
  // The name used in the UI is "LinkedIn Audiences".
  name: 'Linkedin Audiences',
  slug: 'actions-linkedin-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      ad_account_id: {
        label: 'LinkedIn Ad Account Id',
        description: 'The id of the LinkedIn Ad Account where batches should be synced.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings, auth }) => {
      if (!auth?.accessToken) {
        throw new Error('Please authenticate via Oauth before updating other settings and/or enabling the destination.')
      }

      let firstRes

      try {
        // GET the current user's id from LinkedIn's profile API: https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api?context=linkedin%2Fcompliance%2Fcontext&view=li-lms-unversioned&preserve-view=true#request
        // We request `r_basicprofile` scope when a user oauths into LinkedIn, so we retrieve the "Basic Profile Fields": https://learn.microsoft.com/en-us/linkedin/shared/references/v2/profile/basic-profile
        firstRes = await request<ProfileAPIResponse>(`https://api.linkedin.com/rest/me`, {
          method: 'GET'
        })
      } catch (e: any) {
        if (e.message === 'Unauthorized') {
          throw new Error(
            'Invalid LinkedIn Oauth access token. Please reauthenticate to retrieve a valid access token before updating other settings and/or enabling the destination.'
          )
        }
        throw e
      }

      const userId = firstRes?.data?.id

      let secondRes

      try {
        // GET the current user's permissions for this specific Ad Account: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/account-structure/create-and-manage-account-users?view=li-lms-2022-09&tabs=http#get-ad-account-user
        // If the user's role is VIEWER, then they won't have adequate permission to send batch updates to any DMP Segment audience in this LinkedIn account.
        secondRes = await request<AdAccountUserResponse>(
          `https://api.linkedin.com/rest/adAccountUsers/account=urn:li:sponsoredAccount:${settings.ad_account_id}&user=urn:li:person:${userId}`,
          {
            method: 'GET'
          }
        )
      } catch (e: any) {
        if (e.message === 'Not Found') {
          throw new Error(
            'Invalid LinkedIn Ad Account id. Please verify that the LinkedIn Ad Account exists and that you have access to it.'
          )
        }
        throw e
      }

      const userRole = secondRes?.data.role

      if (userRole === 'VIEWER') {
        throw new Error(
          "It looks like you don't have access to this LinkedIn Ad Account. Please reach out to a LinkedIn Ad Account Admin on your team to grant access."
        )
      }

      return true
    },
    refreshAccessToken: async (request, { auth }) => {
      const res = await request<RefreshTokenResponse>('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

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
