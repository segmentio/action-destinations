import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { perform, performBatch } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Inserts or updates an Identify record',
  defaultSubscription: 'type = "identify"',
  fields: {
    traits: {
      label: 'User Properties',
      type: 'object',
      description: 'The properties of the user.',
      default: {
        '@path': '$.traits'
      }
    },
    ...commonFields
  },
  perform: perform('identify'),
  performBatch: performBatch('identify')
}

export default action
