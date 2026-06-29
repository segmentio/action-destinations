import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AWS_REGIONS } from '../../../lib/AWS/utils'
import { send } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send event data to an Amazon SQS queue.',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "group" or type = "alias"',
  fields: {
    payload: {
      label: 'Payload',
      description: 'The event data to send as the SQS message body. Maps the entire Segment event by default.',
      type: 'object',
      default: { '@path': '$.' },
      required: true
    },
    queueUrl: {
      label: 'Queue URL',
      description:
        'The URL of the SQS queue to send messages to. Format: https://sqs.<region>.amazonaws.com/<account-id>/<queue-name>',
      type: 'string',
      required: true
    },
    awsRegion: {
      label: 'AWS Region',
      description: 'The AWS region where the SQS queue is located.',
      type: 'string',
      required: true,
      choices: AWS_REGIONS
    },
    messageGroupId: {
      label: 'Message Group ID',
      description:
        'Required for FIFO queues. Specifies the message group for ordering. Recommended: userId or anonymousId for user-level ordering.',
      type: 'string',
      required: false
    },
    messageDeduplicationId: {
      label: 'Message Deduplication ID',
      description: 'Used for FIFO queues with content-based deduplication disabled. Defaults to Segment messageId.',
      type: 'string',
      required: false
    },
    delaySeconds: {
      label: 'Delay Seconds',
      description: 'The number of seconds to delay message delivery (0-900). Only applies to Standard queues.',
      type: 'number',
      default: 0,
      required: false,
      minimum: 0,
      maximum: 900
    },
    enable_batching: {
      type: 'boolean',
      label: 'Enable Batching',
      description: 'Enable batching of messages using SendMessageBatch API.',
      unsafe_hidden: true,
      required: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of messages per SendMessageBatch request. SQS API limit is 10.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 10,
      minimum: 1,
      maximum: 10
    },
    batch_keys: {
      label: 'Batch Keys',
      description:
        'Fields used to group events into separate batches. Events targeting different queues/regions are batched separately.',
      type: 'string',
      unsafe_hidden: true,
      default: ['awsRegion', 'queueUrl'],
      multiple: true
    },
    max_batch_size: {
      label: 'Max Batch Size',
      description: 'Framework-level cap on batch size. Must not exceed 10 (SQS SendMessageBatch limit).',
      type: 'number',
      required: true,
      minimum: 1,
      maximum: 10,
      default: 10,
      unsafe_hidden: true
    },
    batch_bytes: {
      type: 'number',
      label: 'Batch Bytes',
      description: 'Maximum total bytes per batch. SQS limits each SendMessageBatch to 1MB (1,048,576 bytes).',
      default: 1048576,
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
