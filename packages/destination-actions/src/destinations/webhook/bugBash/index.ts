import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Bug Bash',
  description: 'Updating action description bug bash testing.',
  fields: {
    requiredField: {
      label: 'Required Field',
      description: 'Required field for bug bash testing',
      type: 'string',
      required: true
    },
    optionalField: {
      label: 'Optional Field',
      description: 'Optional field for bug bash testing',
      type: 'string'
    }
  },
  perform: () => {
    return
  }
}

export default action
