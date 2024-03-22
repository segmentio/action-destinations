import { Kafka, ProducerRecord, Partitioners, SASLOptions, KafkaConfig } from 'kafkajs'
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

interface SSLConfig {
  ca: string[]
  rejectUnauthorized: boolean,
  key?: string,
  cert?: string,
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
    sasl:((): SASLOptions | undefined => {
        switch(settings.mechanism){
          case 'plain':
            return {
              username: settings?.username,
              password: settings?.password,
              mechanism: settings.mechanism
            }  as SASLOptions
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
      if(settings?.ssl_ca){
        const ssl: SSLConfig = {
          ca: [`-----BEGIN CERTIFICATE-----\n${settings.ssl_ca.trim()}\n-----END CERTIFICATE-----`],
          rejectUnauthorized: settings.ssl_reject_unauthorized_ca
        }
        if(settings.mechanism === 'client-cert-auth'){
          ssl.key = `-----BEGIN PRIVATE KEY-----\n${settings?.ssl_key?.trim()}\n-----END PRIVATE KEY-----`,
          ssl.cert = `-----BEGIN CERTIFICATE-----\n${settings?.ssl_cert?.trim()}\n-----END CERTIFICATE-----`
        }
        return ssl
      }
      else if(settings.ssl_enabled){
        return settings.ssl_enabled
      } 
      return undefined
    })()
  } as unknown as KafkaConfig

  console.log(kafkaConfig)

  return new Kafka(kafkaConfig)
}

const getProducer = (settings: Settings) => {
  return getKafka(settings).producer({
    createPartitioner: settings.partitionerType === LEGACY_PARTITIONER ? Partitioners.LegacyPartitioner : Partitioners.DefaultPartitioner
  })
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
