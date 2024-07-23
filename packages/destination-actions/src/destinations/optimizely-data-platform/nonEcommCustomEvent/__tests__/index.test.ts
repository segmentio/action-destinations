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

  describe('perform', () => {
    const customEvent = createTestEvent({
      type: 'track',
      event: 'custom',
      timestamp: '2024-02-09T15:30:51.046Z',
      properties: {
        custom_field: 'hello',
        custom_field_num: 12345
      }
    })

    const requestData = {
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
    }

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      const response = await testDestination.testAction('nonEcommCustomEvent', requestData)

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchSnapshot()
    })

    it('Should fail if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      const badData = {
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        mapping: {
          user_identifiers: null
        },
        useDefaultMappings: true,
        event: customEvent
      }

      await expect(testDestination.testAction('nonEcommCustomEvent', badData)).rejects.toThrowError(
        "The root value is missing the required field 'user_identifiers'."
      )
    })

    it('Should handle 400 error (bad body)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(400)

      await expect(testDestination.testAction('nonEcommCustomEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 401 error (no auth)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(401)

      await expect(testDestination.testAction('nonEcommCustomEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 429 error (rate limit)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(429)

      await expect(testDestination.testAction('nonEcommCustomEvent', requestData)).rejects.toThrowError()
    })
  })

  describe('performBatch', () => {
    const customEvents = [
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

    const requestData = {
      events: customEvents,
      settings: {
        apiKey: 'abc123',
        region: 'US'
      },
      mapping: {
        user_identifiers: {
          anonymousId: 'anonId1234',
          userId: 'user1234',
          email: 'test@test.com'
        },
        event_type: 'email',
        event_action: 'opened',
        campaign: 'opti-test-campaign',
        timestamp: '2024-03-01T18:11:27.649Z'
      }
    }

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      const response = await testDestination.testBatchAction('nonEcommCustomEvent', requestData)

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchSnapshot()
    })

    it('Should return empty array if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      const badData = {
        events: customEvents,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        mapping: {
          user_identifiers: null
        },
        useDefaultMappings: true
      }

      await expect(testDestination.testBatchAction('nonEcommCustomEvent', badData)).resolves.toEqual([])
    })

    it('Should handle 400 error (bad body)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(400)

      await expect(testDestination.testBatchAction('nonEcommCustomEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 401 error (no auth)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(401)

      await expect(testDestination.testBatchAction('nonEcommCustomEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 429 error (rate limit)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(429)

      await expect(testDestination.testBatchAction('nonEcommCustomEvent', requestData)).rejects.toThrowError()
    })
  })
})
