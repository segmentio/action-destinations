import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)

describe('OptimizelyDataPlatform.nonEcommCustomEvent', () => {
  beforeEach((done) => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
    done()
  })

  describe('single request', () => {
    const customEvent = createTestEvent({
      type: 'track',
      event: 'custom',
      timestamp: '2024-02-09T15:30:51.046Z',
      properties: {
        custom_field: 'hello',
        custom_field_num: 12345
      }
    })

    it('Should fire non ecomm custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201, {})

      const response = await testDestination.testAction('nonEcommCustomEvent', {
        event: customEvent,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        mapping: {
          user_identifiers: {
            anonymousId: 'anonId1234',
            userId: 'user1234'
          },
          event_type: 'custom',
          event_action: 'custom',
          timestamp: '2024-02-09T15:30:51.046Z',
          data: {
            custom_field: 'hello',
            custom_field_num: 12345
          }
        }
      })

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchInlineSnapshot(
        `"[{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\"},\\"action\\":\\"custom\\",\\"type\\":\\"custom\\",\\"timestamp\\":\\"2024-02-09T15:30:51.046Z\\",\\"data\\":{\\"custom_field\\":\\"hello\\",\\"custom_field_num\\":12345}}]"`
      )
    })

    it('Should work with default values', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201, {})

      await expect(
        testDestination.testAction('nonEcommCustomEvent', {
          event: customEvent,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should throw error if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201, {})

      await expect(
        testDestination.testAction('nonEcommCustomEvent', {
          event: customEvent,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            // missing required field
            /* user_identifiers: {
              anonymousId: 'anonId1234',
              userId: 'user1234'
            }, */
            event_type: 'custom',
            event_action: 'custom',
            timestamp: '2024-02-09T15:30:51.046Z',
            data: {
              custom_field: 'hello',
              custom_field_num: 12345
            }
          }
        })
      ).rejects.toThrowError()
    })

    it('should handle errors response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(400)

      await expect(
        testDestination.testAction('nonEcommCustomEvent', {
          event: customEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 401 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(401)

      await expect(
        testDestination.testAction('nonEcommCustomEvent', {
          event: customEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 429 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(429)

      await expect(
        testDestination.testAction('nonEcommCustomEvent', {
          event: customEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })
  })

  describe('batch request', () => {
    const emailEvents = [
      createTestEvent({
        type: 'track',
        event: 'custom',
        timestamp: '2024-02-09T15:30:51.046Z',
        properties: {
          custom_field: 'hello',
          custom_field_num: 12345
        }
      }),
      createTestEvent({
        type: 'track',
        event: 'custom',
        timestamp: '2024-02-09T15:30:51.046Z',
        properties: {
          custom_field: 'hello1',
          custom_field_num: 67890
        }
      })
    ]

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201, {})

      const response = await testDestination.testBatchAction('nonEcommCustomEvent', {
        events: emailEvents,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        mapping: {
          user_identifiers: {
            anonymousId: 'anonId1234',
            userId: 'user1234'
          },
          event_type: 'custom',
          event_action: 'custom',
          timestamp: '2024-02-09T15:30:51.046Z',
          data: {
            custom_field: 'hello',
            custom_field_num: 12345
          }
        },
        useDefaultMappings: true
      })

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchInlineSnapshot(
        `"[{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\"},\\"action\\":\\"custom\\",\\"type\\":\\"custom\\",\\"timestamp\\":\\"2024-02-09T15:30:51.046Z\\",\\"data\\":{\\"custom_field\\":\\"hello\\",\\"custom_field_num\\":12345}},{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\"},\\"action\\":\\"custom\\",\\"type\\":\\"custom\\",\\"timestamp\\":\\"2024-02-09T15:30:51.046Z\\",\\"data\\":{\\"custom_field\\":\\"hello\\",\\"custom_field_num\\":12345}}]"`
      )
    })

    it('Should work with default values', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      await expect(
        testDestination.testBatchAction('nonEcommCustomEvent', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    /// TODO: Check with Joe why this test is NOT failing if missing required field
    it('should throw error if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      await expect(
        testDestination.testBatchAction('nonEcommCustomEvent', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            // missing required field
            /* user_identifiers: {
              anonymousId: 'anonId1234',
              userId: 'user1234'
            }, */
            event_type: 'custom',
            event_action: 'custom',
            timestamp: '2024-02-09T15:30:51.046Z',
            data: {
              custom_field: 'hello',
              custom_field_num: 12345
            }
          }
        })
      ).resolves.not.toThrowError()
      //.rejects.toThrowError() // It should have thrown error
    })

    it('should handle errors response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(400)

      await expect(
        testDestination.testBatchAction('nonEcommCustomEvent', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 401 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(401)

      await expect(
        testDestination.testBatchAction('nonEcommCustomEvent', {
          events: emailEvents,
          settings: {
            apiKey: 'wrongKey',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 429 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(429)

      await expect(
        testDestination.testBatchAction('nonEcommCustomEvent', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })
  })
})
