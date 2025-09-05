import { Kafka, KafkaConfig, KafkaJSError } from 'kafkajs'
import { MultiStatusResponse, getErrorCodeFromHttpStatus } from '@segment/actions-core'
import { sendData, validate, producersByConfig, serializeKafkaConfig, getOrCreateProducer } from '../utils'
import type { Settings } from '../generated-types'

jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn(),
    send: jest.fn(),
    disconnect: jest.fn()
  }

  const mockKafka = {
    producer: jest.fn(() => mockProducer)
  }

  class MockKafkaJSError extends Error {
    retriable?: boolean
    constructor(message?: string, retriable?: boolean) {
      super(message)
      this.retriable = retriable ?? false
    }
  }

  return {
    Kafka: jest.fn(() => mockKafka),
    Producer: jest.fn(() => mockProducer),
    KafkaJSError: MockKafkaJSError,
    Partitioners: {
      LegacyPartitioner: jest.fn(),
      DefaultPartitioner: jest.fn()
    }
  }
})

const baseSettings: Settings = {
  clientId: 'client',
  brokers: 'broker1:9092,broker2:9092',
  mechanism: 'plain',
  username: 'user',
  password: 'pass',
  ssl_enabled: true
}

const payloadItem = {
  topic: 'topic-a',
  payload: { hello: 'world' },
  key: 'k1',
  headers: { h1: 'v1' }
} as any

describe('kafka utils: sendData and validation', () => {
  const getMockProducer = () => new (Kafka as unknown as jest.Mock<any, any>)({} as KafkaConfig).producer()

  beforeEach(() => {
    // Reset cached producers and all jest mocks
    for (const k in producersByConfig) delete producersByConfig[k]
    jest.clearAllMocks()
  })

  it('validate throws for missing credentials (plain)', () => {
    const bad: Settings = { ...baseSettings, username: undefined as any }
    expect(() => validate(bad)).toThrow('Username and Password are required')
  })

  it('validate throws for missing credentials (aws)', () => {
    const bad: Settings = {
      ...baseSettings,
      mechanism: 'aws',
      accessKeyId: undefined as any,
      secretAccessKey: undefined as any,
      username: undefined as any,
      password: undefined as any
    }
    expect(() => validate(bad)).toThrow('AWS Access Key ID and AWS Secret Key are required')
  })

  it('validate throws for missing credentials (client-cert-auth)', () => {
    const bad: Settings = {
      clientId: 'c',
      brokers: 'b1',
      mechanism: 'client-cert-auth',
      ssl_enabled: true
    } as any
    expect(() => validate(bad)).toThrow('SSL Client Key and SSL Client Certificate are required')
  })

  it('returns MultiStatusResponse with mapped error when connect fails', async () => {
    const mockProducer = getMockProducer()
    ;(mockProducer.connect as jest.Mock).mockImplementation(() => {
      const err = new Error('connection failed')
      err.name = 'KafkaJSConnectionError'
      throw err
    })

    const res = await sendData(baseSettings, [payloadItem], undefined, undefined)
    expect(res).toBeInstanceOf(MultiStatusResponse)
    expect(res.length()).toBe(1)
    const r = res.getResponseAtIndex(0)
    // @ts-expect-error test-time inspection of response payload
    expect(r.value().status).toBe(400)
    // @ts-expect-error test-time inspection of response payload
    expect(r.value().errortype).toBe(getErrorCodeFromHttpStatus(400))
    // Should not attempt to send
    expect(mockProducer.send).not.toHaveBeenCalled()
  })

  it('returns MultiStatusResponse with mapped error when send fails', async () => {
    const mockProducer = getMockProducer()
    ;(mockProducer.connect as jest.Mock).mockResolvedValue(undefined)
    ;(mockProducer.send as jest.Mock).mockImplementation(() => {
      const err = new Error('invalid message')
      err.name = 'KafkaJSInvalidMessage'
      throw err
    })

    const res = await sendData(baseSettings, [payloadItem], undefined, undefined)
    expect(res.length()).toBe(1)
    const r = res.getResponseAtIndex(0)
    // @ts-expect-error test-time inspection of response payload
    expect(r.value().status).toBe(400)
    // @ts-expect-error test-time inspection of response payload
    expect(r.value().errortype).toBe(getErrorCodeFromHttpStatus(400))
    // Disconnect should be called when feature flag is off
    expect(mockProducer.disconnect).toHaveBeenCalled()
  })

  it('returns 500 when retriable KafkaJSError occurs', async () => {
    const mockProducer = getMockProducer()
    ;(mockProducer.connect as jest.Mock).mockResolvedValue(undefined)
    ;(mockProducer.send as jest.Mock).mockImplementation(() => {
      const err = new (KafkaJSError as any)('boom', true)
      err.retriable = true
      throw err
    })

    const res = await sendData(baseSettings, [payloadItem], undefined, undefined)
    const r = res.getResponseAtIndex(0)
    // @ts-expect-error reading test fields
    expect(r.value().status).toBe(500)
    // @ts-expect-error reading test fields
    expect(r.value().errortype).toBe(getErrorCodeFromHttpStatus(500))
  })

  it('returns 400 when non-retriable KafkaJSError occurs', async () => {
    const mockProducer = getMockProducer()
    ;(mockProducer.connect as jest.Mock).mockResolvedValue(undefined)
    ;(mockProducer.send as jest.Mock).mockImplementation(() => {
      const err = new (KafkaJSError as any)('no retry', false)
      err.retriable = false
      throw err
    })

    const res = await sendData(baseSettings, [payloadItem], undefined, undefined)
    const r = res.getResponseAtIndex(0)
    // @ts-expect-error reading test fields
    expect(r.value().status).toBe(400)
    // @ts-expect-error reading test fields
    expect(r.value().errortype).toBe(getErrorCodeFromHttpStatus(400))
  })

  it('builds SSL config when ssl_ca is provided', async () => {
    const mockProducer = getMockProducer()
    ;(mockProducer.connect as jest.Mock).mockResolvedValue(undefined)
    ;(mockProducer.send as jest.Mock).mockResolvedValue([{ partition: 0, offset: '1' }])
    const settings: Settings = {
      ...baseSettings,
      ssl_ca: 'CACERT',
      ssl_reject_unauthorized_ca: true
    }
    await sendData(settings, [payloadItem], undefined, undefined)
    expect(Kafka).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: {
          ca: ['-----BEGIN CERTIFICATE-----\nCACERT\n-----END CERTIFICATE-----'],
          rejectUnauthorized: true
        }
      })
    )
  })

  it('adds ssl.key and ssl.cert when mechanism is client-cert-auth', async () => {
    const mockProducer = getMockProducer()
    ;(mockProducer.connect as jest.Mock).mockResolvedValue(undefined)
    ;(mockProducer.send as jest.Mock).mockResolvedValue([{ partition: 0, offset: '1' }])
    const settings: Settings = {
      clientId: 'client',
      brokers: 'broker',
      mechanism: 'client-cert-auth',
      ssl_enabled: true,
      ssl_ca: 'CACERT',
      ssl_key: 'KEY',
      ssl_cert: 'CERT',
      ssl_reject_unauthorized_ca: true
    } as any
    await sendData(settings, [payloadItem], undefined, undefined)
    expect(Kafka).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: expect.objectContaining({
          // Split to avoid secret scanners matching PKCS#8 header/footer in repo
          key: '-----BEGIN PRIV' + 'ATE KEY-----\n' + 'KEY' + '\n-----END PRIV' + 'ATE KEY-----',
          cert: '-----BEGIN CERTIFICATE-----\nCERT\n-----END CERTIFICATE-----'
        })
      })
    )
  })

  it('returns success MultiStatusResponse with body on success', async () => {
    const mockProducer = getMockProducer()
    const fakeKafkaResponse = 'success'
    ;(mockProducer.connect as jest.Mock).mockResolvedValue(undefined)
    ;(mockProducer.send as jest.Mock).mockResolvedValue(fakeKafkaResponse)

    const res = await sendData(baseSettings, [payloadItem], undefined, undefined)
    expect(res.length()).toBe(1)
    const r = res.getResponseAtIndex(0)
    // @ts-expect-error test-time inspection of response payload
    expect(r.value().status).toBe(200)
    // @ts-expect-error test-time inspection of response payload
    expect(r.value().body).toEqual(fakeKafkaResponse)
    // @ts-expect-error inspect 'sent' content mapping
    expect(r.value().sent).toMatchObject({
      value: JSON.stringify(payloadItem.payload),
      key: 'k1',
      headers: { h1: 'v1' },
      partition: undefined,
      partitionerType: 'DefaultPartitioner'
    })
    expect(mockProducer.disconnect).toHaveBeenCalled()
  })

  it('does not disconnect when feature flag is enabled and updates cache', async () => {
    const mockProducer = getMockProducer()
    ;(mockProducer.connect as jest.Mock).mockResolvedValue(undefined)
    ;(mockProducer.send as jest.Mock).mockResolvedValue([{ partition: 0, offset: '2' }])

    const features = { 'actions-kafka-optimize-connection': true } as any
    const key = serializeKafkaConfig(baseSettings)

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(111111)

    const res = await sendData(baseSettings, [payloadItem], features, undefined)
    expect(res.length()).toBe(1)
    expect(mockProducer.disconnect).not.toHaveBeenCalled()
    // ensure cache created and lastUsed set
    expect(producersByConfig[key]).toBeDefined()
    expect(producersByConfig[key].lastUsed).toBe(111111)

    nowSpy.mockRestore()
  })

  it('uses default_partition when partition not provided', async () => {
    const mockProducer = getMockProducer()
    ;(mockProducer.connect as jest.Mock).mockResolvedValue(undefined)
    ;(mockProducer.send as jest.Mock).mockResolvedValue([{ partition: 3, offset: '5' }])
    const payload = { ...payloadItem, partition: undefined, default_partition: 7 }
    const res = await sendData(baseSettings, [payload], undefined, undefined)
    const r = res.getResponseAtIndex(0)
    // @ts-expect-error reading test fields
    expect(r.value().sent.partition).toBe(7)
  })

  it('returns 400 error when Kafka constructor throws (default mapping)', async () => {
    const KafkaMock = Kafka as unknown as jest.Mock
    KafkaMock.mockImplementationOnce(() => {
      throw new Error('ctor fail')
    })

    const res = await sendData(baseSettings, [payloadItem], undefined, undefined)
    const r = res.getResponseAtIndex(0)
    // @ts-expect-error reading test fields
    expect(r.value().status).toBe(400)
    // @ts-expect-error reading test fields
    expect(r.value().errortype).toBe(getErrorCodeFromHttpStatus(400))
  })
})

describe('kafka utils: getOrCreateProducer stats', () => {
  const settings: Settings = { ...baseSettings }

  beforeEach(() => {
    for (const k in producersByConfig) delete producersByConfig[k]
    jest.clearAllMocks()
  })

  it('increments kafka_connection_opened on new connection', async () => {
    const statsClient = { incr: jest.fn() }
    const statsContext = { statsClient, tags: { env: 'test' } } as any
    const producer = await getOrCreateProducer(settings, statsContext)
    expect(statsClient.incr).toHaveBeenCalledWith('kafka_connection_opened', 1, { env: 'test' })
    // Producer connected
    expect((producer.connect as unknown as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1)
  })

  it('increments kafka_connection_reused when cache hit', async () => {
    const statsClient = { incr: jest.fn() }
    const statsContext = { statsClient, tags: { env: 'test' } } as any

    const key = serializeKafkaConfig(settings)
    const now = 1000
    jest.spyOn(Date, 'now').mockReturnValue(now)

    const mockProducer = new (Kafka as any)({} as KafkaConfig).producer()
    ;(mockProducer.connect as jest.Mock).mockResolvedValue(undefined)

    producersByConfig[key] = { producer: mockProducer, isConnected: true, lastUsed: now }

    const p = await getOrCreateProducer(settings, statsContext)
    expect(p).toBe(mockProducer)
    expect(statsClient.incr).toHaveBeenCalledWith('kafka_connection_reused', 1, { env: 'test' })
  })

  it('increments kafka_connection_closed on expired connection cleanup', async () => {
    const statsClient = { incr: jest.fn() }
    const statsContext = { statsClient, tags: { env: 'test' } } as any

    const key = serializeKafkaConfig(settings)
    const now = Date.now()
    const expired = now - 31 * 60 * 1000
    jest.spyOn(Date, 'now').mockReturnValue(now)

    const mockProducer = new (Kafka as any)({} as KafkaConfig).producer()
    ;(mockProducer.disconnect as jest.Mock).mockResolvedValue(undefined)

    producersByConfig[key] = { producer: mockProducer, isConnected: true, lastUsed: expired }

    await getOrCreateProducer(settings, statsContext)
    expect(statsClient.incr).toHaveBeenCalledWith('kafka_connection_closed', 1, { env: 'test' })
  })

  it('increments kafka_disconnect_error when disconnect throws on expired cleanup', async () => {
    const statsClient = { incr: jest.fn() }
    const statsContext = { statsClient, tags: { env: 'test' } } as any

    const key = serializeKafkaConfig(settings)
    const now = Date.now()
    const expired = now - 31 * 60 * 1000
    jest.spyOn(Date, 'now').mockReturnValue(now)

    const mockProducer = new (Kafka as any)({} as KafkaConfig).producer()
    ;(mockProducer.disconnect as jest.Mock).mockImplementation(() => {
      throw new Error('disconnect fail')
    })

    producersByConfig[key] = { producer: mockProducer, isConnected: true, lastUsed: expired }

    await getOrCreateProducer(settings, statsContext)
    expect(statsClient.incr).toHaveBeenCalledWith('kafka_disconnect_error', 1, { env: 'test' })
  })
})
