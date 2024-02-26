import { Kafka, SASLOptions, ProducerRecord, Partitioners } from 'kafkajs'
import type { DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'

export const getTopics = async (settings: Settings): Promise<DynamicFieldResponse> => {
  const kafka = new Kafka({
    clientId: settings.clientId,
    brokers: [settings.brokers],
    ssl: true,
    sasl: {
      mechanism: settings.mechanism,
      username: settings.username,
      password: settings.password
    } as SASLOptions
  })

  const admin = kafka.admin()
  await admin.connect()
  const topics = await admin.listTopics()
  await admin.disconnect()

  return { choices: topics.map((topic) => ({ label: topic, value: topic })) }
}

export const sendData = async (settings: Settings, payload: Payload[]) => {
  const groupedPayloads: { [topic: string]: Payload[] } = {}

  payload.forEach((p) => {
    const { topic } = p
    if (!groupedPayloads[topic]) {
      groupedPayloads[topic] = []
    }
    groupedPayloads[topic].push(p)
  })

  interface PayloadGroup {
    topic: string
    payloads: Payload[]
  }

  const payloadGroups: PayloadGroup[] = Object.keys(groupedPayloads).map((topic) => ({
    topic,
    payloads: groupedPayloads[topic]
  }))

  const kafka = new Kafka({
    clientId: settings.clientId,
    brokers: [settings.brokers],
    ssl: true,
    sasl: {
      mechanism: settings.mechanism,
      username: settings.username,
      password: settings.password
    } as SASLOptions
  })

  const producer = kafka.producer({
    createPartitioner:
      settings.partitionerType === 'LegacyPartitioner'
        ? Partitioners.LegacyPartitioner
        : Partitioners.DefaultPartitioner
  })

  await producer.connect()

  for (const group of payloadGroups) {
    const { topic, payloads } = group

    const messages = payloads.map((payload) => ({
      value: JSON.stringify(payload.payload),
      key: payload.key,
      headers: payload?.headers ?? undefined,
      partition: payload?.partition ?? payload?.default_partition ?? undefined,
      partitionerType: settings.partitionerType
    }))

    const data = {
      topic,
      messages
    }

    await producer.send(data as ProducerRecord)
  }

  await producer.disconnect()
}
