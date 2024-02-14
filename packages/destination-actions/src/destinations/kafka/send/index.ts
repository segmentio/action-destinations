import { Kafka, Mechanism } from 'kafkajs'

import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send data to a Kafka topic',
  defaultSubscription: 'type = "track"',
  fields: {},
  perform: async (_request, { settings, payload }) => {
    const kafka = new Kafka({
      clientId: 'segment-actions-kafka-producer',
      brokers: String(settings.brokers).split(','),
      ssl: true,
      sasl: {
        mechanism: settings.saslAuthenticationMechanism,
        username: settings.username,
        password: settings.password
      } as unknown as Mechanism
    })

    const producer = kafka.producer()
    await producer.connect()
    await producer.send({
      topic: settings.topic,
      messages: [{ value: JSON.stringify(payload) }]
    })

    await producer.disconnect()
  }
}

export default action
