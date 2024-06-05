import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import customAttributesSync from './customAttributesSync'
import { RefreshTokenResponse } from './types'

const destination: DestinationDefinition<Settings> = {
  name: 'Contentstack',
  slug: 'actions-contentstack',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
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
      },
      personalizeApiBaseUrl: {
        label: 'Personalize API base URL',
        type: 'string',
        required: true,
        description: 'Your region-based personalize API base URL.'
      },
      personalizeEdgeApiBaseUrl: {
        label: 'Personalize Edge API base URL',
        type: 'string',
        required: true,
        description: 'Your region-based personalize-edge API base URL.'
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      const res = await request<RefreshTokenResponse>(auth.refreshTokenUrl || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          refresh_token: auth.refreshToken
        })
      })

      return { accessToken: res?.data?.access_token, refreshToken: res?.data?.refresh_token }
    }
  },
  extendRequest({ auth, settings }) {
    return {
      headers: {
        Authorization: `Bearer ${auth?.accessToken}`,
        organization_uid: settings.orgId,
        'x-project-uid': settings.personalizeProjectId
      }
    }
  },
  actions: {
    customAttributesSync
  }
}

export default destination
