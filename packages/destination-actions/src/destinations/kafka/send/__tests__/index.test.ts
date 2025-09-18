import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Kafka, KafkaConfig, Partitioners } from 'kafkajs'
import { producersByConfig, serializeKafkaConfig, getOrCreateProducer } from '../../utils'
import { Settings } from '../../generated-types'
import { Producer } from 'kafkajs'
import { IntegrationError } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Destination)

jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn(),
    send: jest.fn(),
    disconnect: jest.fn()
  }

  const mockKafka = {
    producer: jest.fn(() => mockProducer)
  }

  return {
    Kafka: jest.fn(() => mockKafka),
    Producer: jest.fn(() => mockProducer),
    Partitioners: {
      LegacyPartitioner: jest.fn(),
      DefaultPartitioner: jest.fn()
    }
  }
})

const testData = {
  event: {
    type: 'track',
    event: 'Test Event',
    properties: {
      email: 'test@iterable.com'
    },
    traits: {},
    timestamp: '2024-02-26T16:53:08.910Z',
    sentAt: '2024-02-26T16:53:08.910Z',
    receivedAt: '2024-02-26T16:53:08.907Z',
    messageId: 'a82f52d9-d8ed-40a8-89e3-b9c04701a5f6',
    userId: 'user1234',
    anonymousId: 'anonId1234',
    context: {}
  },
  useDefaultMappings: false,
  settings: {
    brokers: 'yourBroker',
    clientId: 'yourClientId',
    mechanism: 'plain',
    username: 'yourUsername',
    password: 'yourPassword',
    partitionerType: 'DefaultPartitioner',
    ssl_enabled: true
  },
  mapping: {
    topic: 'test-topic',
    payload: { '@path': '$.' }
  }
}

describe('Kafka.send', () => {
  it('kafka library is initialized correctly for SASL plain auth', async () => {
    await testDestination.testAction('send', testData as any)

    expect(Kafka).toHaveBeenCalledWith({
      clientId: 'yourClientId',
      brokers: ['yourBroker'],
      requestTimeout: 10000,
      ssl: true,
      retry: { retries: 0 },
      sasl: {
        mechanism: 'plain',
        username: 'yourUsername',
        password: 'yourPassword'
      }
    })
  })

  it('kafka library is initialized correctly for SASL scram-sha-256 auth', async () => {
    const testData1 = {
      ...testData,
      settings: {
        ...testData.settings,
        mechanism: 'scram-sha-256'
      }
    }

    await testDestination.testAction('send', testData1 as any)

    expect(Kafka).toHaveBeenCalledWith({
      clientId: 'yourClientId',
      brokers: ['yourBroker'],
      requestTimeout: 10000,
      ssl: true,
      retry: { retries: 0 },
      sasl: {
        mechanism: 'scram-sha-256',
        username: 'yourUsername',
        password: 'yourPassword'
      }
    })
  })

  it('kafka library is initialized correctly for SASL scram-sha-512 auth', async () => {
    const testData1 = {
      ...testData,
      settings: {
        ...testData.settings,
        mechanism: 'scram-sha-512'
      }
    }

    await testDestination.testAction('send', testData1 as any)

    expect(Kafka).toHaveBeenCalledWith({
      clientId: 'yourClientId',
      brokers: ['yourBroker'],
      requestTimeout: 10000,
      ssl: true,
      retry: { retries: 0 },
      sasl: {
        mechanism: 'scram-sha-512',
        username: 'yourUsername',
        password: 'yourPassword'
      }
    })
  })

  it('kafka library is initialized correctly for SASL aws auth', async () => {
    const testData3 = {
      ...testData,
      settings: {
        ...testData.settings,
        mechanism: 'aws',
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
        authorizationIdentity: 'testAuthorizationIdentity'
      }
    }

    await testDestination.testAction('send', testData3 as any)

    expect(Kafka).toHaveBeenCalledWith({
      clientId: 'yourClientId',
      brokers: ['yourBroker'],
      requestTimeout: 10000,
      ssl: true,
      retry: { retries: 0 },
      sasl: {
        mechanism: 'aws',
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
        authorizationIdentity: 'testAuthorizationIdentity'
      }
    })
  })

  it('kafka library is initialized correctly when SSL_CA provided', async () => {
    const testData4 = {
      ...testData,
      settings: {
        ...testData.settings,
        ssl_ca: 'yourCACert',
        ssl_reject_unauthorized_ca: true
      }
    }

    await testDestination.testAction('send', testData4 as any)

    expect(Kafka).toHaveBeenCalledWith({
      clientId: 'yourClientId',
      brokers: ['yourBroker'],
      requestTimeout: 10000,
      ssl: {
        ca: ['-----BEGIN CERTIFICATE-----\nyourCACert\n-----END CERTIFICATE-----'],
        rejectUnauthorized: true
      },
      retry: { retries: 0 },
      sasl: {
        mechanism: 'plain',
        username: 'yourUsername',
        password: 'yourPassword'
      }
    })
  })

  it('kafka producer is initialized correctly', async () => {
    await testDestination.testAction('send', testData as any)

    expect(new Kafka({} as KafkaConfig).producer).toBeCalledWith({
      createPartitioner: Partitioners.DefaultPartitioner
    })
  })

  it('kafka.producer() send() is called with the correct payload', async () => {
    await testDestination.testAction('send', testData as any)

    expect(new Kafka({} as KafkaConfig).producer().send).toBeCalledWith({
      topic: 'test-topic',
      messages: [
        {
          value:
            '{"anonymousId":"anonId1234","context":{},"event":"Test Event","messageId":"a82f52d9-d8ed-40a8-89e3-b9c04701a5f6","properties":{"email":"test@iterable.com"},"receivedAt":"2024-02-26T16:53:08.907Z","sentAt":"2024-02-26T16:53:08.910Z","timestamp":"2024-02-26T16:53:08.910Z","traits":{},"type":"track","userId":"user1234"}',
          key: undefined,
          headers: undefined,
          partition: undefined,
          partitionerType: 'DefaultPartitioner'
        }
      ]
    })
  })

  it('serializeKafkaConfig() generates the correct producer connection cache key', async () => {
    const settings: Settings = {
      clientId: 'testClientId',
      brokers: 'https://broker1:9092,https://broker2:9092',
      mechanism: 'plain',
      username: 'testUsername',
      password: 'testPassword',
      accessKeyId: 'testAccessKeyId',
      secretAccessKey: 'testSecretAccessKey',
      authorizationIdentity: 'testAuthorizationIdentity',
      ssl_ca: 'testCACert',
      ssl_cert: 'testCert',
      ssl_key: 'testKey',
      ssl_reject_unauthorized_ca: true,
      ssl_enabled: true
    }

    const key = serializeKafkaConfig(settings)
    expect(typeof key).toBe('string')
    expect(key).toBe(
      '{"clientId":"testClientId","brokers":["https://broker1:9092","https://broker2:9092"],"mechanism":"plain","username":"testUsername","password":"testPassword","accessKeyId":"testAccessKeyId","secretAccessKey":"testSecretAccessKey","authorizationIdentity":"testAuthorizationIdentity","ssl_ca":"testCACert","ssl_cert":"testCert","ssl_key":"testKey","ssl_reject_unauthorized_ca":true,"ssl_enabled":true}'
    )
  })

  it('serializeKafkaConfig generates the correct producer connection cache key', async () => {
    const settings: Settings = {
      clientId: 'testClientId',
      brokers: 'https://broker1:9092,https://broker2:9092',
      mechanism: 'plain',
      username: 'testUsername',
      password: 'testPassword',
      accessKeyId: 'testAccessKeyId',
      secretAccessKey: 'testSecretAccessKey',
      authorizationIdentity: 'testAuthorizationIdentity',
      ssl_ca: 'testCACert',
      ssl_cert: 'testCert',
      ssl_key: 'testKey',
      ssl_reject_unauthorized_ca: true,
      ssl_enabled: true
    }

    const key = serializeKafkaConfig(settings)
    expect(typeof key).toBe('string')
    expect(key).toBe(
      '{"clientId":"testClientId","brokers":["https://broker1:9092","https://broker2:9092"],"mechanism":"plain","username":"testUsername","password":"testPassword","accessKeyId":"testAccessKeyId","secretAccessKey":"testSecretAccessKey","authorizationIdentity":"testAuthorizationIdentity","ssl_ca":"testCACert","ssl_cert":"testCert","ssl_key":"testKey","ssl_reject_unauthorized_ca":true,"ssl_enabled":true}'
    )
  })

  it('logs and rethrows IntegrationError when Kafka constructor fails', async () => {
    // Make Kafka constructor throw
    ;(Kafka as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new IntegrationError('some settings error', 'Kafka Connection Error', 400)
    })

    const logger = { crit: jest.fn() } as any

    try {
      await testDestination.testAction('send', { ...(testData as any), logger })
    } catch (error) {
      expect(error).toBeInstanceOf(IntegrationError)
      expect((error as Error).message).toBe('Kafka Connection Error: some settings error')
      expect((error as IntegrationError).status).toBe(400)
    }

    expect(logger.crit).toHaveBeenCalledWith(expect.stringContaining('Kafka Connection Error:'))
  })

  it('wraps producer connect errors and logs with critical level', async () => {
    const err = new Error('connect failed')
    err.name = 'KafkaJSError'

    // Make connect reject for the next call
    const producer = new (Kafka as unknown as jest.Mock)({} as KafkaConfig).producer()
    ;(producer.connect as unknown as jest.Mock).mockRejectedValueOnce(err)

    const logger = { crit: jest.fn() } as any

    try {
      await testDestination.testAction('send', { ...(testData as any), logger })
    } catch (error) {
      expect(error).toBeInstanceOf(IntegrationError)
      expect((error as Error).message).toBe('Kafka Connection Error - KafkaJSError: connect failed')
      expect((error as IntegrationError).status).toBe(500)
    }

    expect(logger.crit).toHaveBeenCalledWith(expect.stringContaining('Kafka Connection Error'))
  })

  it('wraps producer send errors and logs with critical level', async () => {
    // Ensure connect resolves
    const producer = new (Kafka as unknown as jest.Mock)({} as KafkaConfig).producer()
    ;(producer.connect as unknown as jest.Mock).mockResolvedValueOnce(undefined)

    const err = new Error('broker unavailable')
    err.name = 'KafkaJSError'
    ;(producer.send as unknown as jest.Mock).mockRejectedValueOnce(err)

    const logger = { crit: jest.fn() } as any

    try {
      await testDestination.testAction('send', { ...(testData as any), logger })
    } catch (error) {
      expect(error).toBeInstanceOf(IntegrationError)
      expect((error as Error).message).toBe('Kafka Producer Error - KafkaJSError: broker unavailable')
      expect((error as IntegrationError).status).toBe(500)
    }

    expect(logger.crit).toHaveBeenCalledWith(expect.stringContaining('Kafka Send Error'))
  })

  it('extracts nested Kafka cause for connect errors', async () => {
    const producer = new (Kafka as unknown as jest.Mock)({} as KafkaConfig).producer()
    ;(producer.connect as unknown as jest.Mock).mockReset()

    // Simulate a KafkaJSError with a nested cause coming from Kafka
    const kafkaErr = new Error('outer wrapper error') as any
    kafkaErr.name = 'KafkaJSError'
    kafkaErr.cause = new Error('brokers down')
    kafkaErr.cause.name = 'BrokerNotAvailable'
    ;(producer.connect as unknown as jest.Mock).mockRejectedValueOnce(kafkaErr)

    const logger = { crit: jest.fn() } as any

    try {
      await testDestination.testAction('send', { ...(testData as any), logger })
    } catch (error) {
      expect(error).toBeInstanceOf(IntegrationError)
      expect((error as IntegrationError).message).toBe('Kafka Connection Error - BrokerNotAvailable: brokers down')
      expect((error as IntegrationError).status).toBe(500)
    }

    expect(logger.crit).toHaveBeenCalledWith(expect.stringContaining('BrokerNotAvailable'))
  })

  it('extracts nested Kafka cause for send errors', async () => {
    const producer = new (Kafka as unknown as jest.Mock)({} as KafkaConfig).producer()
    ;(producer.connect as unknown as jest.Mock).mockReset()
    ;(producer.connect as unknown as jest.Mock).mockResolvedValueOnce(undefined)

    // Simulate a KafkaJSError with a nested cause on send
    const kafkaErr = new Error('outer wrapper error') as any
    kafkaErr.name = 'KafkaJSError'
    kafkaErr.cause = new Error('message too large')
    kafkaErr.cause.name = 'MessageSizeTooLarge'
    ;(producer.send as unknown as jest.Mock).mockReset()
    ;(producer.send as unknown as jest.Mock).mockRejectedValueOnce(kafkaErr)

    const logger = { crit: jest.fn() } as any

    try {
      await testDestination.testAction('send', { ...(testData as any), logger })
    } catch (error) {
      expect(error).toBeInstanceOf(IntegrationError)
      expect((error as IntegrationError).message).toBe('Kafka Producer Error - MessageSizeTooLarge: message too large')
      expect((error as IntegrationError).status).toBe(500)
    }

    expect(logger.crit).toHaveBeenCalledWith(expect.stringContaining('MessageSizeTooLarge'))
  })
})

describe('getOrCreateProducer', () => {
  const settings = {
    clientId: 'testClientId',
    brokers: 'https://broker1:9092,https://broker2:9092',
    mechanism: 'plain',
    username: 'testUsername',
    password: 'testPassword',
    accessKeyId: 'testAccessKeyId',
    secretAccessKey: 'testSecretAccessKey',
    authorizationIdentity: 'testAuthorizationIdentity',
    ssl_ca: 'testCACert',
    ssl_cert: 'testCert',
    ssl_key: 'testKey',
    ssl_reject_unauthorized_ca: true,
    ssl_enabled: true
  }

  afterEach(() => {
    for (const key in producersByConfig) {
      delete producersByConfig[key]
    }
    jest.restoreAllMocks()
  })

  it('getOrCreateProducer ensures existing connections are reused', async () => {
    const now = Date.now()
    const key = serializeKafkaConfig(settings)

    const fakeProducer = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      sendBatch: jest.fn(),
      transaction: jest.fn()
    } as unknown as Producer

    // Insert into producer cache as active and recent
    producersByConfig[key] = {
      producer: fakeProducer,
      isConnected: true,
      lastUsed: now
    }

    jest.spyOn(Date, 'now').mockReturnValue(now)

    const result = await getOrCreateProducer(settings, undefined)

    expect(result).toBe(fakeProducer)
    expect(fakeProducer.connect).toHaveBeenCalled() // this is a no-op since it's already connected, but is done to ensure the producer is ready anyway. It's an  idempotent operation.
  })

  it('getOrCreateProducer replaces expired connections and creates a new connection', async () => {
    const now = Date.now()
    const expiredTime = now - 31 * 60 * 1000 // 31 minutes ago
    const key = serializeKafkaConfig(settings)

    const oldProducer = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      sendBatch: jest.fn(),
      transaction: jest.fn()
    } as unknown as Producer

    // Put expired producer in cache
    producersByConfig[key] = {
      producer: oldProducer,
      isConnected: true,
      lastUsed: expiredTime
    }

    jest.spyOn(Date, 'now').mockReturnValue(now)

    const result = await getOrCreateProducer(settings, undefined)

    // Expect the old producer to be cleaned up
    expect(oldProducer.disconnect).toHaveBeenCalled()

    // Expect a new producer to have connected
    expect(result.connect).toHaveBeenCalled()

    // Cache should now hold a new producer
    expect(producersByConfig[key].producer).toBe(result)
    expect(result).not.toBe(oldProducer)
  })
})
