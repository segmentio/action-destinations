import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { sendAlias, sendAliasBatch } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Alias',
  description: 'Link a previous anonymous or temporary ID to a user ID in Altertable.',
  defaultSubscription: 'type = "alias"',
  fields: {
    previousId: {
      label: 'Previous ID',
      description: 'The previous user identifier (maps to distinct_id in the Altertable API).',
      type: 'string',
      required: true,
      default: {
        '@path': '$.previousId'
      }
    },
    ...commonFields,
    enable_batching: {
      label: 'Enable Batching',
      type: 'boolean',
      required: true,
      default: true,
      unsafe_hidden: true,
      description: 'When enabled, events are sent in batches to Altertable.'
    },
    batch_size: {
      label: 'Batch Size',
      type: 'number',
      required: false,
      default: 1000,
      unsafe_hidden: true,
      description: 'Maximum number of events per batch request.'
    },
    batch_bytes: {
      label: 'Batch Bytes',
      type: 'number',
      required: false,
      default: 4000000,
      unsafe_hidden: true,
      description: 'Maximum batch payload size in bytes.'
    }
  },
  perform: (request, { settings, payload }) => {
    return sendAlias(request, settings, payload)
  },
  performBatch: (request, { settings, payload }) => {
    return sendAliasBatch(request, settings, payload)
  }
}

export default action
