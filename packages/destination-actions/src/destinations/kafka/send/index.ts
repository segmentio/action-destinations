import { Kafka } from 'kafkajs'

import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send data to a Kafka topic',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name: {
      label: 'Event Name',
      description: 'The name of the event you want to send to Kafka.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    product_id: {
      label: 'Product ID',
      description: 'The ID of the product you want to send to Kafka.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.product_id'
      }
    }
  },
  // perform: async (request, { payload }) => {
  perform: async () => {
    const kafka = new Kafka({
      clientId: 'segment-actions-kafka-producer',
      brokers: ['pkc-rgm37.us-west-2.aws.confluent.cloud:9092'],
      ssl: true,
      sasl: {
        mechanism: 'plain', // scram-sha-256 or scram-sha-512
        username: '123', // Replace here (this will be Settings)
        password: '456' // Replace here (this will be Settings)
      }
    })
    const producer = kafka.producer()
    await producer.connect()
    await producer.send({
      topic: 'topic_0',
      messages: [{ value: 'Hello KafkaJS user!' }]
    })
    await producer.disconnect()
  }
}

export default action
