import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Engage',
  description: 'Engage action.',
  fields: {
    placeholder: {
      label: 'Placeholder',
      description: 'Placeholder',
      type: 'string'
    }
  },
  perform: () => {
    return undefined
  }
}

export default action
