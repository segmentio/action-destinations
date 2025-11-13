import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AWS_REGIONS } from '../../../lib/AWS/utils'
import { send } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send event to AWS Kinesis',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group"',
  fields: {
    awsRegion: {
      label: 'AWS Region',
      description: 'The AWS region where the Kinesis stream is located',
      type: 'string',
      required: true,
      choices: AWS_REGIONS,
      disabledInputMethods: ['variable', 'function', 'freeform', 'enrichment']
    },
    partitionKey: {
      label: 'Partition Key',
      description: 'The partition key to use for the record',
      type: 'string',
      required: true,
      default: { '@path': '$.messageId' }
    },
    streamName: {
      label: 'Stream Name',
      description: 'The name of the Kinesis stream to send records to',
      type: 'string',
      required: true
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      unsafe_hidden: true,
      default: ['awsRegion', 'streamName', 'partitionKey'],
      multiple: true
    },
    max_batch_size: {
      label: 'Max Batch Size',
      description: 'The maximum number of payloads to include in a batch.',
      type: 'number',
      required: true,
      choices: AWS_REGIONS,
      disabledInputMethods: ['variable', 'function', 'freeform', 'enrichment']
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Kinesis?',
      description: 'If true, Segment will batch events before sending to Kines.',
      default: true,
      unsafe_hidden: true
    },
    batch_bytes: {
      type: 'number',
      label: 'Batch Bytes',
      description: 'The number of bytes to write to the kinesis shard in a single batch. Limit is 1MB.',
      default: 1000000, // 1MB,
      required: true,
      unsafe_hidden: true
    }
  },
  perform: async (_requests, { settings, payload, statsContext, logger, signal }) => {
    await send(settings, [payload], statsContext, logger, signal)
  },
  performBatch: async (_requests, { settings, payload, statsContext, logger, signal }) => {
    await send(settings, payload, statsContext, logger, signal)
  }
}

export default action
