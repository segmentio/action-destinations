import { Kafka, Partitioners, SASLOptions, KafkaConfig, KafkaJSError, Producer } from 'kafkajs'
import {
  DynamicFieldResponse,
  IntegrationError,
  Features,
  StatsContext,
  MultiStatusResponse,
  getErrorCodeFromHttpStatus
} from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'
import { DEFAULT_PARTITIONER, Message, TopicMessages, SSLConfig, CachedProducer } from './types'
import { PRODUCER_REQUEST_TIMEOUT_MS, PRODUCER_TTL_MS, FLAGON_NAME } from './constants'

export const producersByConfig: Record<string, CachedProducer> = {}

export const serializeKafkaConfig = (settings: Settings): string => {
  const config = {
    clientId: settings.clientId,
    brokers: settings.brokers
      .trim()
      .split(',')
      .map((b) => b.trim())
      .sort(),
    mechanism: settings.mechanism,
    username: settings.username,
    password: settings.password,
    accessKeyId: settings.accessKeyId,
    secretAccessKey: settings.secretAccessKey,
    authorizationIdentity: settings.authorizationIdentity,
    ssl_ca: settings.ssl_ca,
    ssl_cert: settings.ssl_cert,
    ssl_key: settings.ssl_key,
    ssl_reject_unauthorized_ca: settings.ssl_reject_unauthorized_ca,
    ssl_enabled: settings.ssl_enabled
  }

  return JSON.stringify(config)
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
    requestTimeout: PRODUCER_REQUEST_TIMEOUT_MS,
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
    })(),
    retry: {
      retries: 0
      // disable retries as centrifuge already takes care of that.
    }
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

export const getOrCreateProducer = async (
  settings: Settings,
  statsContext: StatsContext | undefined
): Promise<Producer> => {
  const key = serializeKafkaConfig(settings)
  const now = Date.now()

  const cached = producersByConfig[key]

  if (cached) {
    const isExpired = now - cached.lastUsed > PRODUCER_TTL_MS
    if (!isExpired) {
      cached.lastUsed = now
      statsContext?.statsClient?.incr('kafka_connection_reused', 1, statsContext?.tags)
      await cached.producer.connect() // this is idempotent, so is safe
      return cached.producer
    }
    if (cached.isConnected) {
      try {
        statsContext?.statsClient?.incr('kafka_connection_closed', 1, statsContext?.tags)
        await cached.producer.disconnect()
      } catch {
        statsContext?.statsClient?.incr('kafka_disconnect_error', 1, statsContext?.tags)
      }
    }
    delete producersByConfig[key]
  }

  const kafka = getKafka(settings)
  const producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner
  })
  await producer.connect()
  statsContext?.statsClient?.incr('kafka_connection_opened', 1, statsContext?.tags)
  producersByConfig[key] = {
    producer,
    isConnected: true,
    lastUsed: now
  }
  return producer
}

function kafkaErrorToHttpStatus(error: KafkaJSError | Error) {
  // Default error response
  let status = 400

  if (!error || !error.name) return { status, code: getErrorCodeFromHttpStatus(status) }

  if (error instanceof KafkaJSError && error.retriable) {
    status = 500
  }

  return { status, code: getErrorCodeFromHttpStatus(status) }
}

function fillKafkaMultiStatusErrorResponse(
  error: Error | KafkaJSError,
  topicMessages: TopicMessages,
  multiStatusResponse: MultiStatusResponse
) {
  const { code, status } = kafkaErrorToHttpStatus(error as Error)
  topicMessages.messages.forEach((payloadItem, index) =>
    multiStatusResponse.setErrorResponseAtIndex(index, {
      status,
      errortype: code,
      errormessage: error?.message ?? 'Kafka error occurred',
      sent: { ...payloadItem },
      body: error.message
    })
  )
}

export const sendData = async (
  settings: Settings,
  payload: Payload[],
  features: Features | undefined,
  statsContext: StatsContext | undefined
) => {
  validate(settings)

  // There can be only one topic per batch.
  const topic = payload[0].topic

  const topicMessages: TopicMessages = {
    topic,
    messages: payload.map(
      (body) =>
        ({
          value: JSON.stringify(body.payload),
          key: body.key,
          headers: body?.headers ?? undefined,
          partition: body?.partition ?? body?.default_partition ?? undefined,
          partitionerType: DEFAULT_PARTITIONER
        } as Message)
    )
  }

  if (statsContext) {
    const { statsClient, tags } = statsContext
    const set = new Set<string>()
    for (const p of payload) {
      set.add(`${p.topic}-${p.partition}-${p.default_partition}`)
    }
    // Add stats to track batch keys for kafka
    statsClient?.histogram('kafka.configurable_batch_keys.unique_keys', set.size, tags)
  }

  let producer: Producer
  const multiStatusResponse: MultiStatusResponse = new MultiStatusResponse()

  try {
    if (features && features[FLAGON_NAME]) {
      producer = await getOrCreateProducer(settings, statsContext)
    } else {
      producer = getProducer(settings)
      await producer.connect()
    }
  } catch (error) {
    fillKafkaMultiStatusErrorResponse(error as Error, topicMessages, multiStatusResponse)
    return multiStatusResponse
  }

  try {
    await producer.send(topicMessages)
    topicMessages.messages.forEach((payloadItem, index) =>
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: { ...payloadItem },
        body: 'success'
      })
    )
  } catch (error) {
    fillKafkaMultiStatusErrorResponse(error as Error, topicMessages, multiStatusResponse)
  }

  if (features && features[FLAGON_NAME]) {
    const key = serializeKafkaConfig(settings)
    if (producersByConfig[key]) {
      producersByConfig[key].lastUsed = Date.now()
    }
  } else {
    await producer.disconnect()
  }

  return multiStatusResponse
}
