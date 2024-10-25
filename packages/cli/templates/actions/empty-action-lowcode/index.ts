import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: '{{name}}',
  description: '{{description}}',
  {{#hasDefaultSubscription}}
  defaultSubscription: '{{{trigger}}}',
  {{/hasDefaultSubscription}}
  fields: {
    {{#fields}}
    {{key}}: {
      label: '{{label}}',
      description: '{{description}}',
      type: '{{type}}',
      required: {{required}},
      {{#hasDefault}}
      {{#isTemplate}}
      default: {
        "@template": "{{value}}"
      }
      {{/isTemplate}}
      {{^isTemplate}}
      default: {{{defaultValue}}}
      {{/isTemplate}}
      {{/hasDefault}}
    },
    {{/fields}}
  },
  perform: (request, { payload }) => {
    return request('{{{apiEndpoint}}}', {
      method: '{{httpMethod}}',
      json: payload
    })
  }
}

export default action
