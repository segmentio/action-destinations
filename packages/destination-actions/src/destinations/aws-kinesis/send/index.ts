import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send event to AWS Kinesis',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group"',
  fields: {
    payload: {
      label: 'Payload',
      description: 'The data to send to AWS Kinesis',
      type: 'object',
      required: true,
      default: { '@path': '$.' }
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
      required: true,
      default: { '@path': '$.properties.streamName' }
    },
    awsRegion: {
      label: 'AWS Region',
      description: 'The AWS region where the Kinesis stream is located',
      type: 'string',
      required: true,
      default: { '@path': '$.properties.awsRegion' }
    }
  },
  perform: async (_request, _data) => {
    // Todo implement functionality
  }
}

export default action
