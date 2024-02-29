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
    partitionerType: 'DefaultPartitioner'
  },
  mapping: {
    topic: 'test-topic',
    payload: { '@path': '$.' }
  }
}

describe('Kafka.send', () => {
  it('kafka library is initialized correctly', async () => {
    await testDestination.testAction('send', testData as any)

    expect(Kafka).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'yourClientId',
        brokers: ['yourBroker'],
        ssl: true,
        sasl: {
          mechanism: 'plain',
          username: 'yourUsername',
          password: 'yourPassword'
        }
      })
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
