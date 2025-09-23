import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'
import { ensureSourceIdHook } from './hooks'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send event data to Amazon EventBridge.',
  fields: {
    data: {
      label: 'Detail',
      description: 'The event data to send to Amazon EventBridge.',
      type: 'object',
      default: { '@path': '$.' },
      required: true
    },
    detailType: {
      label: 'Detail Type',
      description: `Detail Type of the event. Used to determine what fields to expect in the event Detail. Value cannot be longer than 128 characters.`,
      type: 'string',
      maximum: 128,
      default: { '@path': '$.type' },
      required: true
    },
    resources: {
      label: 'Resources',
      description: `AWS resources, identified by Amazon Resource Name (ARN), which the event primarily concerns. Any number, including zero, may be present.`,
      type: 'string',
      multiple: true,
      required: false
    },
    time: {
      label: 'Time',
      description: 'The timestamp the event occurred. Accepts a date in ISO 8601 format.',
      type: 'string',
      format: 'date-time',
      default: { '@path': '$.timestamp' },
      required: false
    },
    enable_batching: {
      type: 'boolean',
      label: '(Hidden field): Enable Batching',
      description: '(Hidden field): Enable Batching',
      unsafe_hidden: false,
      required: true,
      default: true
    },
    batch_size: {
      label: '(Hidden field): Batch Size',
      description: `(Hidden field): Maximum number of events to include in each batch. Actual batch sizes may be lower.`,
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 20,
      minimum: 1,
      maximum: 20
    }
  },
  hooks: {
    retlOnMappingSave: {
      ...ensureSourceIdHook
    },
    onMappingSave: {
      ...ensureSourceIdHook
    }
  },
  perform: (_, { payload, settings, hookOutputs }) => {
    return send([payload], settings, hookOutputs)
  },
  performBatch: (_, { payload, settings, hookOutputs }) => {
    return send(payload, settings, hookOutputs)
  }
}

export default action
