import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { sendIdentify, sendIdentifyBatch } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify a user in Altertable.',
  fields: {
    traits: {
      label: 'Traits',
      description: 'The traits of the user',
      type: 'object',
      required: true,
      default: {
        '@path': '$.traits'
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
  perform: (request, { payload, settings }) => {
    return sendIdentify(request, settings, payload)
  },
  performBatch: (request, { settings, payload }) => {
    return sendIdentifyBatch(request, settings, payload)
  }
}

export default action
