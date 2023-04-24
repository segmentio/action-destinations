import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: '{{name}}',
  description: '{{description}}',
  fields: {
    {{#fields}}
   {{key}}: {
     label: '{{label}}',
     description: '{{description}}',
     type: '{{type}}',
     required: {{required}},
     {{#default}}
     default: {{{value}}}
     {{/default}}
   },
   {{/fields}}
  },
  perform: (request, { payload }) => {
    return request('{{{apiEndpoint}}}', {
      method: '{{httpMethod}}',
      json: {
        {{ #fields }}
        {{key}}: {{mapping}},
        {{/fields}}
      }
    })
  }
}

export default action
