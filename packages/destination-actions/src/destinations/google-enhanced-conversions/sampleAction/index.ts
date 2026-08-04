import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sample Action',
  description: 'Sample no-op action added for bug bash testing (row 72 - unrelated change to an oauth2 destination).',
  fields: {
    sampleField: {
      label: 'Sample Field',
      description: 'Sample field for bug bash testing',
      type: 'string',
      required: false
    },
    sampleEmail: {
      label: 'Sample Email',
      description: 'Sample identifier field for bug bash testing',
      type: 'string',
      required: false,
      category: 'identifier'
    },
    sampleUserId: {
      label: 'Sample User ID',
      description: 'Sample identifier field for bug bash testing',
      type: 'string',
      required: false,
      category: 'identifier'
    }
  },
  perform: () => {
    return
  }
}

export default action
