import { Kafka, SASLOptions, ProducerRecord, Partitioners } from 'kafkajs'
import { DynamicFieldResponse, IntegrationError, ErrorCodes } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'

export const DEFAULT_PARTITIONER = 'DefaultPartitioner'
export const LEGACY_PARTITIONER = 'LegacyPartitioner'

interface Message {
  value: string
  key?: string
  headers?: { [key: string]: string }
  partition?: number
  partitionerType?: typeof LEGACY_PARTITIONER | typeof DEFAULT_PARTITIONER
}
interface TopicMessages {
  topic: string
  messages: Message[]
}

export const getTopics = async (settings: Settings): Promise<DynamicFieldResponse> => {
  const kafka = getKafka(settings)
  const admin = kafka.admin()
  await admin.connect()
  const topics = await admin.listTopics()
  await admin.disconnect()
  return { choices: topics.map((topic) => ({ label: topic, value: topic })) }
}

const getKafka = (settings: Settings) => {
  return new Kafka({
    clientId: settings.clientId,
    brokers: settings.brokers
      .trim()
      .split(',')
      .map((broker) => broker.trim()),
    ssl: settings.ssl === 'none' ? false : true,
    sasl: {
      mechanism: settings.mechanism,
      ...(settings.mechanism === 'aws'
        ? {
            accessKeyId: settings.username,
            secretAccessKey: settings.password,
            authorizationIdentity: settings.authorizationIdentity
          }
        : { username: settings.username, password: settings.password })
    } as SASLOptions
  })
}

const getProducer = (settings: Settings) => {
  return getKafka(settings).producer({
    createPartitioner:
      settings.partitionerType === LEGACY_PARTITIONER ? Partitioners.LegacyPartitioner : Partitioners.DefaultPartitioner
  })
}

export const validate = (settings: Settings) => {
  if (settings.mechanism === 'aws' && ['', undefined].includes(settings.authorizationIdentity)) {
    throw new IntegrationError(
      'AWS mechanism requires an authorization identity',
      ErrorCodes.INVALID_AUTHENTICATION,
      400
    )
  }
}

export const sendData = async (settings: Settings, payload: Payload[]) => {
  validate(settings)

  const groupedPayloads: { [topic: string]: Payload[] } = {}

  payload.forEach((p) => {
    const { topic } = p
    if (!groupedPayloads[topic]) {
      groupedPayloads[topic] = []
    }
    groupedPayloads[topic].push(p)
  })

  const topicMessages: TopicMessages[] = Object.keys(groupedPayloads).map((topic) => ({
    topic,
    messages: groupedPayloads[topic].map(
      (payload) =>
        ({
          value: JSON.stringify(payload.payload),
          key: payload.key,
          headers: payload?.headers ?? undefined,
          partition: payload?.partition ?? payload?.default_partition ?? undefined,
          partitionerType: settings.partitionerType
        } as Message)
    )
  }))

  const producer = getProducer(settings)

  await producer.connect()

  for (const data of topicMessages) {
    await producer.send(data as ProducerRecord)
  }

  await producer.disconnect()
}
