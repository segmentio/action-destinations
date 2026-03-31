import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AWS_REGIONS } from '../../../lib/AWS/utils'
import { send } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send event data to an Amazon Kinesis Data Stream.',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {
    payload: {
      label: 'Payload',
      description: 'The event data to send as the Kinesis record payload. Maps the entire Segment event by default.',
      type: 'object',
      default: { '@path': '$.' },
      required: true
    },
    streamName: {
      label: 'Stream Name',
      description: 'The name of the Kinesis stream to put the data record into.',
      type: 'string',
      required: true
    },
    partitionKey: {
      label: 'Partition Key',
      description:
        'Determines which shard in the stream the data record is assigned to. Defaults to messageId for even distribution. Use userId or anonymousId for user-level ordering.',
      type: 'string',
      default: { '@path': '$.messageId' },
      required: true
    },
    awsRegion: {
      label: 'AWS Region',
      description: 'The AWS region where the Kinesis stream is located.',
      type: 'string',
      required: true,
      choices: AWS_REGIONS
    },
    enable_batching: {
      type: 'boolean',
      label: 'Enable Batching',
      description: 'Enable batching of records using PutRecords API.',
      unsafe_hidden: true,
      required: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of records to include in each PutRecords request. Kinesis API limit is 500.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 500,
      minimum: 1,
      maximum: 500
    },
    batch_keys: {
      label: 'Batch Keys',
      description:
        'Fields used to group events into separate batches. Events with different values for these fields will be sent in different batches.',
      type: 'string',
      unsafe_hidden: true,
      default: ['awsRegion', 'streamName'],
      multiple: true
    },
    max_batch_size: {
      label: 'Max Batch Size',
      description:
        'Framework-level cap on how many events can be in a single batch. Must not exceed 500 (Kinesis PutRecords limit).',
      type: 'number',
      required: true,
      minimum: 1,
      maximum: 500,
      default: 500,
      unsafe_hidden: true
    },
    batch_bytes: {
      type: 'number',
      label: 'Batch Bytes',
      description: 'Maximum total bytes per batch. Kinesis limits each PutRecords call to 1MB.',
      default: 1000000,
      required: true,
      unsafe_hidden: true
    }
  },
  perform: (_, { payload, settings, statsContext, logger, signal }) => {
    return send([payload], settings, statsContext, logger, signal)
  },
  performBatch: (_, { payload, settings, statsContext, logger, signal }) => {
    return send(payload, settings, statsContext, logger, signal)
  }
}

export default action
