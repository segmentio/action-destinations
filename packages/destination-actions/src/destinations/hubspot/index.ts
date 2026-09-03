import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendCustomBehavioralEvent from './sendCustomBehavioralEvent'
import upsertContact from './upsertContact'
import upsertCompany from './upsertCompany'
import upsertCustomObjectRecord from './upsertCustomObjectRecord'
import upsertObject from './upsertObject'
import customEvent from './customEvent'
import { HUBSPOT_BASE_URL } from './properties'
import { HUBSPOT_DATE_BASED_API_VERSION, HUBSPOT_LEGACY_OAUTH_API_VERSION } from './versioning-info'
interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'HubSpot Cloud Mode (Actions)',
  slug: 'actions-hubspot-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      portalId: {
        description: 'The Hub ID of your HubSpot account.',
        label: 'Hub ID',
        type: 'string'
      }
    },
    testAuthentication: (request) => {
      // HubSpot has no auth test endpoint, so use a lightweight CRM read
      return request(`${HUBSPOT_BASE_URL}/crm/objects/${HUBSPOT_DATE_BASED_API_VERSION}/contacts?limit=1`)
    },
    refreshAccessToken: async (request, { auth }) => {
      const body = () =>
        new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })

      // No flag is readable here, so retry v1 rather than let a rejected account stop refreshing
      const res = await request<RefreshTokenResponse>(
        `${HUBSPOT_BASE_URL}/oauth/${HUBSPOT_DATE_BASED_API_VERSION}/token`,
        { method: 'POST', body: body(), throwHttpErrors: false }
      )

      if (res.ok) {
        return { accessToken: res.data?.access_token }
      }

      const legacyRes = await request<RefreshTokenResponse>(
        `${HUBSPOT_BASE_URL}/oauth/${HUBSPOT_LEGACY_OAUTH_API_VERSION}/token`,
        { method: 'POST', body: body() }
      )

      return { accessToken: legacyRes.data?.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      skipResponseCloning: true,
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  actions: {
    sendCustomBehavioralEvent,
    upsertContact,
    upsertCompany,
    upsertCustomObjectRecord,
    upsertObject,
    customEvent
  }
}

export default destination
