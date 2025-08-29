import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getTopics, sendData } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send data to a Kafka topic',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group"',
  fields: {
    topic: {
      label: 'Topic',
      description: 'The Kafka topic to send messages to. This field auto-populates from your Kafka instance.',
      type: 'string',
      required: true,
      dynamic: true
    },
    payload: {
      label: 'Payload',
      description: 'The data to send to Kafka',
      type: 'object',
      required: true,
      default: { '@path': '$.' }
    },
    headers: {
      label: 'Headers',
      description: 'Header data to send to Kafka. Format is Header key, Header value (optional).',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    },
    partition: {
      label: 'Partition',
      description: 'The partition to send the message to (optional)',
      type: 'integer'
    },
    default_partition: {
      label: 'Default Partition',
      description: 'The default partition to send the message to (optional)',
      type: 'integer'
    },
    key: {
      label: 'Message Key',
      description: 'The key for the message (optional)',
      type: 'string'
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Kafka?',
      description: 'If true, Segment will batch events before sending to Kafka.',
      default: true,
      unsafe_hidden: true
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      multiple: true,
      default: ['partition', 'default_partition']
    }
  },
  dynamicFields: {
    topic: async (_, { settings }) => {
      return getTopics(settings)
    }
  },
  perform: async (_request, { settings, payload, features, statsContext }) => {
    // disabled stream mode for kafka
    await sendData(settings, [payload], features, statsContext)
  },
  performBatch: async (_request, { settings, payload, features, statsContext }) => {
    return await sendData(settings, payload, features, statsContext)
  }
}

export default action
