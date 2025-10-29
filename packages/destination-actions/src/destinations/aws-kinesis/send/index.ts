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
  perform: async (_requests, _data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  },
  performBatch: async (_requests, _data) => {
    // Example performBatch implementation
    // for (const batch of requests) {
    //   await sendBatchedDataToKinesis(batch, settings)
    // }
  }
}

export default action
