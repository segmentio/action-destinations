import { Kafka, ProducerRecord, Partitioners, SASLOptions, KafkaConfig, KafkaJSError } from 'kafkajs'
import { DynamicFieldResponse, IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'
import { DependsOnConditions } from '@segment/actions-core/destination-kittypes'

export const DEFAULT_PARTITIONER = 'DefaultPartitioner'

export const DEPENDS_ON_PLAIN_OR_SCRAM: DependsOnConditions = {
  match: 'any',
  conditions: [
    {
      fieldKey: 'mechanism',
      operator: 'is',
      value: 'plain'
    },
    {
      fieldKey: 'mechanism',
      operator: 'is',
      value: 'scram-sha-256'
    },
    {
      fieldKey: 'mechanism',
      operator: 'is',
      value: 'scram-sha-512'
    }
  ]
}
export const DEPEONDS_ON_AWS: DependsOnConditions = {
  conditions: [
    {
      fieldKey: 'mechanism',
      operator: 'is',
      value: 'aws'
    }
  ]
}
export const DEPENDS_ON_CLIENT_CERT: DependsOnConditions = {
  conditions: [
    {
      fieldKey: 'mechanism',
      operator: 'is',
      value: 'client-cert-auth'
    }
  ]
}

interface Message {
  value: string
  key?: string
  headers?: { [key: string]: string }
  partition?: number
  partitionerType?: typeof DEFAULT_PARTITIONER
}

interface TopicMessages {
  topic: string
  messages: Message[]
}

interface SSLConfig {
  ca: string[]
  rejectUnauthorized: boolean
  key?: string
  cert?: string
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
  const kafkaConfig = {
    clientId: settings.clientId,
    brokers: settings.brokers
      .trim()
      .split(',')
      .map((broker) => broker.trim()),
    sasl: ((): SASLOptions | undefined => {
      switch (settings.mechanism) {
        case 'plain':
          return {
            username: settings?.username,
            password: settings?.password,
            mechanism: settings.mechanism
          } as SASLOptions
        case 'scram-sha-256':
        case 'scram-sha-512':
          return {
            username: settings.username,
            password: settings.password,
            mechanism: settings.mechanism
          } as SASLOptions
        case 'aws':
          return {
            accessKeyId: settings.accessKeyId,
            secretAccessKey: settings.secretAccessKey,
            authorizationIdentity: settings.authorizationIdentity,
            mechanism: settings.mechanism
          } as SASLOptions
        default:
          return undefined
      }
    })(),
    ssl: (() => {
      if (settings?.ssl_ca) {
        const ssl: SSLConfig = {
          ca: [`-----BEGIN CERTIFICATE-----\n${settings.ssl_ca.trim()}\n-----END CERTIFICATE-----`],
          rejectUnauthorized: settings.ssl_reject_unauthorized_ca
        }
        if (settings.mechanism === 'client-cert-auth') {
          ;(ssl.key = `-----BEGIN PRIVATE KEY-----\n${settings?.ssl_key?.trim()}\n-----END PRIVATE KEY-----`),
            (ssl.cert = `-----BEGIN CERTIFICATE-----\n${settings?.ssl_cert?.trim()}\n-----END CERTIFICATE-----`)
        }
        return ssl
      } else if (settings.ssl_enabled) {
        return settings.ssl_enabled
      }
      return undefined
    })()
  } as unknown as KafkaConfig

  try {
    return new Kafka(kafkaConfig)
  } catch (error) {
    throw new IntegrationError(
      `Kafka Connection Error: ${(error as KafkaJSError).message}`,
      'KAFKA_CONNECTION_ERROR',
      400
    )
  }
}

export const validate = (settings: Settings) => {
  if (
    ['plain', 'scram-sha-256', 'scram-sha-512'].includes(settings.mechanism) &&
    (!settings.username || !settings.password)
  ) {
    throw new IntegrationError(
      'Username and Password are required for PLAIN and SCRAM authentication mechanisms',
      'SASL_PARAMS_MISSING',
      400
    )
  }
  if (['aws'].includes(settings.mechanism) && (!settings.accessKeyId || !settings.secretAccessKey)) {
    throw new IntegrationError(
      'AWS Access Key ID and AWS Secret Key are required for AWS authentication mechanism',
      'SASL_AWS_PARAMS_MISSING',
      400
    )
  }
  if (['client-cert-auth'].includes(settings.mechanism) && (!settings.ssl_key || !settings.ssl_cert)) {
    throw new IntegrationError(
      'SSL Client Key and SSL Client Certificate are required for Client Certificate authentication mechanism',
      'SSL_CLIENT_CERT_AUTH_PARAMS_MISSING',
      400
    )
  }
}

const getProducer = (settings: Settings) => {
  return getKafka(settings).producer({
    createPartitioner: Partitioners.DefaultPartitioner
  })
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
          partitionerType: DEFAULT_PARTITIONER
        } as Message)
    )
  }))

  const producer = getProducer(settings)

  await producer.connect()

  for (const data of topicMessages) {
    try {
      await producer.send(data as ProducerRecord)
    } catch (error) {
      throw new IntegrationError(
        `Kafka Producer Error: ${(error as KafkaJSError).message}`,
        'KAFKA_PRODUCER_ERROR',
        400
      )
    }
  }

  await producer.disconnect()
}
