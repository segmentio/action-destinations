import { Kafka, SASLOptions } from 'kafkajs'

import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send data to a Kafka topic',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group"',
  fields: {
    topic: {
      label: 'Topic',
      description: 'The Kafka topic to send messages to.',
      type: 'string',
      required: true
    },
    payload: {
      label: 'Payload',
      description: 'The data to send to Kafka',
      type: 'object',
      required: true,
      default: { '@path': '$.' }
    },
    messageKey: {
      label: 'Message Key',
      description: 'The key for the message (optional)',
      type: 'string'
    }
  },
  perform: async (_request, { settings, payload }) => {
    const kafka = new Kafka({
      clientId: settings.clientId,
      brokers: [settings.brokers],
      ssl: true,
      sasl: {
        mechanism: settings.saslAuthenticationMechanism,
        username: settings.username,
        password: settings.password
      } as SASLOptions
    })

    const producer = kafka.producer()
    await producer.connect()
    const structuredPayload = {
      topic: String(payload.topic.split(',')),
      messages: [] as { key?: string; value: string }[]
    }

    const message: { key?: string; value: string } = { value: JSON.stringify(payload) }

    if (payload.messageKey) {
      message.key = String(payload.messageKey)
    }

    structuredPayload.messages.push(message)

    const admin = kafka.admin()
    await admin.connect()
    const topics = await admin.listTopics()
    console.log(topics)
    await admin.disconnect()

    await producer.send(structuredPayload)
    await producer.disconnect()

    // We need to return something here.
    return { status: 'ok' }
  }
}

export default action
