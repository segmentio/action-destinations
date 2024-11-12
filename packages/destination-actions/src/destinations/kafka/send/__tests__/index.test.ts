import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Kafka, KafkaConfig, Partitioners } from 'kafkajs'

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

    expect(Kafka).toHaveBeenCalledWith(
     {
        clientId: 'yourClientId',
        brokers: ['yourBroker'],
        ssl: true,
        sasl: {
          mechanism: 'plain',
          username: 'yourUsername',
          password: 'yourPassword'
        }
      }
    )
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

    expect(Kafka).toHaveBeenCalledWith(
     {
        clientId: 'yourClientId',
        brokers: ['yourBroker'],
        ssl: true,
        sasl: {
          mechanism: 'scram-sha-256',
          username: 'yourUsername',
          password: 'yourPassword'
        }
      }
    )
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

    expect(Kafka).toHaveBeenCalledWith(
     {
        clientId: 'yourClientId',
        brokers: ['yourBroker'],
        ssl: true,
        sasl: {
          mechanism: 'scram-sha-512',
          username: 'yourUsername',
          password: 'yourPassword'
        }
      }
    )
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

    expect(Kafka).toHaveBeenCalledWith(
     {
        clientId: 'yourClientId',
        brokers: ['yourBroker'],
        ssl: true,
        sasl: {
          mechanism: 'aws',
          accessKeyId: 'testAccessKeyId',
          secretAccessKey: 'testSecretAccessKey',
          authorizationIdentity: 'testAuthorizationIdentity'
        }
      }
    )
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

    expect(Kafka).toHaveBeenCalledWith(
     {
        clientId: 'yourClientId',
        brokers: ['yourBroker'],
        ssl: {
          ca: ['-----BEGIN CERTIFICATE-----\nyourCACert\n-----END CERTIFICATE-----'],
          rejectUnauthorized: true
        },
        sasl: {
          mechanism: 'plain',
          username: 'yourUsername',
          password: 'yourPassword'
        }
      }
    )
  })

  it('kafka library is initialized correctly when SSL_CA provided and mechanism is client-cert-auth', async () => {
    const testData5 = {
      ...testData,
      settings: {
        mechanism: 'client-cert-auth',
        brokers: 'yourBroker',
        clientId: 'yourClientId',
        partitionerType: 'DefaultPartitioner',
        ssl_enabled: true,
        ssl_ca: 'yourCACert',
        ssl_reject_unauthorized_ca: true,
        ssl_key: 'yourKey',
        ssl_cert: 'yourCert',
      }
    }
    
    await testDestination.testAction('send', testData5 as any)

    expect(Kafka).toHaveBeenCalledWith(
     {
        clientId: 'yourClientId',
        brokers: ['yourBroker'],
        ssl: {
          ca: ['-----BEGIN CERTIFICATE-----\nyourCACert\n-----END CERTIFICATE-----'],
          rejectUnauthorized: true,
          key: '-----BEGIN PRIVATE KEY-----\nyourKey\n-----END PRIVATE KEY-----',
          cert: '-----BEGIN CERTIFICATE-----\nyourCert\n-----END CERTIFICATE-----'
        }
      }
    )
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
})
