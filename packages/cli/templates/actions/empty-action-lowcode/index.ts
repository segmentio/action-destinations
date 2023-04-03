import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: '{{name}}',
  description: '{{description}}',
  fields: {
    {{#fields}}
   {{name}}: {
     label: '{{label}}',
     description: '{{description}}',
     type: '{{type}}',
     required: {{required}}
   },
   {{/fields}}
  },
  perform: (request, { payload }) => {
    return request('{{{apiEndpoint}}}', {
      method: '{{httpMethod}}',
      json: '{{ performJSON }}'
    })
  }
}

export default action
