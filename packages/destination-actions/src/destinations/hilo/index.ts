import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import identify from './identify'
import group from './group'
import track from './track'
import page from './page'
import screen from './screen'

interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Hilo',
  slug: 'actions-hilo',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
    fields: {
      integrationId: {
        description: 'Hilo integration ID. This can be found on the integration page.',
        label: 'Integration ID',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      return request('https://api.hilohq.com/oauth/token/info')
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>('https://api.hilohq.com/oauth/token', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data?.access_token }
    }
  },

  extendRequest({ auth, settings }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      },
      searchParams: {
        integration_id: settings?.integrationId
      }
    }
  },

  onDelete: async (request, { payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload.
    return request(`https://api.hilohq.com/v1/events/delete`, {
      method: 'POST',
      json: {
        event: {
          contact_id: payload.userId
        }
      }
    })
  },

  actions: {
    identify,
    group,
    track,
    page,
    screen
  },

  presets: [
    {
      name: 'Track Calls',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    },
    {
      name: 'Page Calls',
      subscribe: 'type = "page"',
      partnerAction: 'page',
      mapping: defaultValues(page.fields),
      type: 'automatic'
    },
    {
      name: 'Screen Calls',
      subscribe: 'type = "screen"',
      partnerAction: 'screen',
      mapping: defaultValues(screen.fields),
      type: 'automatic'
    },
    {
      name: 'Identify Calls',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Group Calls',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    }
  ]
}

export default destination
