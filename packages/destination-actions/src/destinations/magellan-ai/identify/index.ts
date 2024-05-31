import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { buildPerformer } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description:
    'If you have your own identifiers for customers, Magellan AI can accept that identifier and report it back to you with other measurement data.',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'Your internal, unique identifier for the user',
      type: 'string',
      default: { '@path': '$.userId' },
      required: true
    }
  },
  perform: buildPerformer('identify')
}

export default action
