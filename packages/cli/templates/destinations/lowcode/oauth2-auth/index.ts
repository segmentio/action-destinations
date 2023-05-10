import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

{{#json.actions}}
import {{key}} from './{{key}}'
{{/json.actions}}

const destination: DestinationDefinition<Settings> = {
  name: '{{json.name}}',
  slug: '{{json.slug}}',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      {{#json.oauth.fields}}
      {{key}}: {
        label: '{{label}}',
        description: '{{description}}',
        type: '{{type}}',
        required: {{required}}
      },
      {{/json.oauth.fields}}
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
    {{key}},
    {{/json.actions}}
  }
}

export default destination
