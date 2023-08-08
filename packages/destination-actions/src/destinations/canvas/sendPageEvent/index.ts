import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { perform, performBatch } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page',
  description: 'Adds a page view record',
  defaultSubscription: 'type = "page"',
  fields: {
    name: {
      type: 'string',
      label: 'Name',
      description: 'Page name',
      required: false,
      default: { '@path': '$.name' }
    },
    properties: {
      type: 'object',
      label: 'Properties',
      description: 'Properties to associate with the page view',
      required: false,
      default: { '@path': '$.properties' }
    },
    ...commonFields
  },
  perform: perform('page'),
  performBatch: performBatch('page')
}

export default action
