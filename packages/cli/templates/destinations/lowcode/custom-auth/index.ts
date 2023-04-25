import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

{{#json.actions}}
import {{name}} from './{{name}}'
{{/json.actions}}

const destination: DestinationDefinition<Settings> = {
  name: '{{name}}',
  slug: '{{slug}}',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      {{#json.oauth.fields}}
      {{name}}: {
        label: '{{label}}',
        description: '{{description}}',
        type: '{{type}}',
        required: {{required}}
      },
      {{/json.oauth.fields}}
    },
    testAuthentication: (request) => {
      return request('{{{json.oauth.apiEndpoint}}}', {
        method: '{{json.oauth.httpMethod}}'
      })
    }
  },

  actions: {
    {{#json.actions}}
    {{name}},
    {{/json.actions}}
  }
}

export default destination
