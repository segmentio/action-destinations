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
    scheme: 'basic',
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
    testAuthentication: (request) => {
      // Please update the code here for further customization
      return request('{{{json.oauth.apiEndpoint}}}', {
        method: '{{json.oauth.httpMethod}}'
      })
    }
  },

  extendRequest({ settings }) {
    // Please update the code here to modify the request headers
    return {
      username: settings.username,
      password: settings.password
    }
  },

  actions: {
    {{#json.actions}}
    {{key}},
    {{/json.actions}}
  }
}

export default destination
