import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AWS_REGIONS, APP_AWS_REGION } from '../../../lib/AWS/utils'
import { sendToKinesis } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send data to an Amazon Kinesis stream',
  defaultSubscription:
    'type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group" or type = "alias"',
  fields: {
    payload: {
      label: 'Payload',
      description:
        'The data to send to Kinesis. JSON-serialized and base64-encoded before sending. Output depends entirely on the mapping created.',
      type: 'object',
      required: true,
      default: { '@path': '$.' }
    },
    partitionKey: {
      label: 'Partition Key',
      description:
        'Determines which shard in the stream the data record is assigned to. Default: messageId. Recommend choosing a partition key with low throughput (e.g. user_id).',
      type: 'string',
      required: false,
      default: { '@path': '$.messageId' }
    },
    streamName: {
      label: 'Stream Name',
      description: 'The name of the destination Kinesis stream.',
      type: 'string',
      required: true
    },
    region: {
      label: 'AWS Region',
      description: 'The AWS region of the destination Kinesis stream.',
      type: 'string',
      required: true,
      default: APP_AWS_REGION,
      choices: AWS_REGIONS
    },
    enable_batching: {
      type: 'boolean',
      label: '(Hidden field): Enable Batching',
      description: '(Hidden field): Enable Batching',
      unsafe_hidden: true,
      required: true,
      default: true
    },
    batch_size: {
      label: '(Hidden field): Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 500,
      minimum: 1,
      maximum: 500
    }
  },
  perform: (_, { payload, settings }) => {
    return sendToKinesis([payload], settings)
  },
  performBatch: (_, { payload, settings }) => {
    return sendToKinesis(payload, settings)
  }
}

export default action
