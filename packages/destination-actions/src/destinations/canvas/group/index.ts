import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { perform, performBatch } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Group',
  description: 'Inserts or updates a group record',
  defaultSubscription: 'type = "group"',
  fields: {
    group_id: {
      label: 'Group ID',
      type: 'string',
      description: 'The unique identifier of the group.',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      label: 'Group Properties',
      type: 'object',
      description: 'The properties of the group.',
      default: {
        '@path': '$.traits'
      }
    },
    ...commonFields
  },
  perform: perform('group'),
  performBatch: performBatch('group')
}

export default action
