import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Noop',
  description: 'A NOOP Action used for private internal services',
  fields: {
    noop: {
      label: 'NOOP',
      description: 'A single NOOP field',
      type: 'string',
      default: {
        '@path': '$.event'
      }
    }
  },
  perform: (_, { statsContext }) => {
    statsContext?.statsClient.incr('actions_noop_perform_hit', 1)
    return undefined
  }
}

export default action
