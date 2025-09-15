import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { perform, performBatch } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Screen Event',
  description: 'Adds a screen event record in Canvas',
  defaultSubscription: 'type = "screen"',
  fields: {
    name: {
      type: 'string',
      label: 'Name',
      description: 'Screen name',
      required: false,
      default: { '@path': '$.name' }
    },
    properties: {
      type: 'object',
      label: 'Properties',
      description: 'Properties to associate with the screen',
      required: false,
      default: { '@path': '$.properties' }
    },
    ...commonFields
  },
  perform: perform('screen'),
  performBatch: performBatch('screen')
}

export default action
