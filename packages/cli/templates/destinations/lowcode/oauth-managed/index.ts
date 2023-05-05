import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

{{#json.actions}}
import {{name}} from './{{name}}'
{{/json.actions}}

const destination: DestinationDefinition<Settings> = {
  name: '{{json.name}}',
  slug: '{{json.slug}}',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
    fields: {
      username: {
        label: 'Username',
        description: 'Your {{json.name}} username',
        type: 'string',
        required: true
      },
      password: {
        label: 'password',
        description: 'Your {{json.name}} password.',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request('{{{json.oauth.apiEndpoint}}}', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  actions: {
    {{#json.actions}}
    {{name}},
    {{/json.actions}}
  }
}

export default destination
