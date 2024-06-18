import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import customAttributesSync from './customAttributesSync'
import { RefreshTokenResponse } from './types'
import { getNewAuth, setNewAuth } from './utils'
import { CS_REGIONS } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Contentstack',
  slug: 'actions-contentstack',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
    fields: {
      personalizeProjectId: {
        label: 'Personalize project ID',
        type: 'string',
        required: true,
        description: "Your Personalize project ID to which Segment's data should be synced."
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      const newAuth = getNewAuth(auth?.accessToken)

      const res = await request<RefreshTokenResponse>(CS_REGIONS[newAuth.location] || '', {
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

      return { accessToken: setNewAuth(res?.data), refreshToken: res?.data?.refresh_token }
    }
  },
  extendRequest({ auth, settings }) {
    const newAuth = getNewAuth(auth?.accessToken as string)
    return {
      headers: {
        Authorization: `Bearer ${newAuth?.accessToken}`,
        organization_uid: newAuth.organization_uid,
        'x-project-uid': settings.personalizeProjectId
      }
    }
  },
  actions: {
    customAttributesSync
  }
}

export default destination
