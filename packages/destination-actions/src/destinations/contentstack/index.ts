import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { ACCESS_TOKEN_URL } from './constants'
import customAttributesSync from './customAttributesSync'

interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_in?: number
  location?: string
  region?: string
  organization_uid?: string
  authorization_type?: string
  user_uid?: string
  stack_api_key?: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Contentstack',
  slug: 'actions-contentstack',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      orgId: {
        label: 'Organization ID',
        type: 'string',
        required: true,
        description: "Your organization ID to which Segment's data should be synced."
      },
      personalizeProjectId: {
        label: 'Personalize project ID',
        type: 'string',
        required: true,
        description: "Your Personalize project ID to which Segment's data should be synced."
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      const res = await request<RefreshTokenResponse>(ACCESS_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          refresh_token: auth.refreshToken
          // redirect_uri: "redirect_uri"
        })
      })

      return { accessToken: res.data.access_token, refreshToken: res.data.refresh_token }
    }
  },
  actions: {
    customAttributesSync
  }
}

export default destination
