import { Kafka, SASLOptions } from 'kafkajs'

import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send data to a Kafka topic',
  defaultSubscription: 'type = "track"',
  fields: {
    messageKey: {
      label: 'Message Key',
      description: 'The key for the message (optional)',
      type: 'string'
    },
    payload: {
      label: 'Payload',
      description: 'The data to send to Kafka',
      type: 'object',
      required: true,
      default: '@properties'
    }
  },
  perform: async (_request, { settings, payload }) => {
    const kafka = new Kafka({
      clientId: 'segment-actions-kafka-producer',
      brokers: String(settings.brokers).split(','),
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
      topic: settings.topic,
      messages: [] as { key?: string; value: string }[]
    }

    const message: { key?: string; value: string } = { value: JSON.stringify(payload) }

    if (payload.messageKey) {
      message.key = String(payload.messageKey)
    }

    structuredPayload.messages.push(message)

    await producer.send(structuredPayload)
    await producer.disconnect()

    // We need to return something here.
    return { status: 'ok' }
    /* return [
      {
        request: {
          text: async () => Promise.resolve(JSON.stringify(structuredPayload))
        }
      }
    ] */
  }
}

export default action
