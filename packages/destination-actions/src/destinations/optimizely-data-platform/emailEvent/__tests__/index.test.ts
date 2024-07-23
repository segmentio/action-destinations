import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)

describe('OptimizelyDataPlatform.emailEvent', () => {
  beforeEach((done) => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
    done()
  })
  describe('perform', () => {
    const emailEvent = createTestEvent({
      type: 'track',
      event: 'Email Opened',
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: 'some_audience_name',
          computation_id: 'abc'
        },
        traits: {
          email: 'test.email@test.com'
        }
      },
      traits: {
        email: 'test.email@test.com',
        optimizely_vuid: 'vuid identifier'
      },
      properties: {
        email: 'test.email@test.com',
        campaign_id: '123456',
        campaign_name: 'opti-test-campaign',
        link_url: 'https://url-from-email-clicked.com'
      }
    })

    const requestData = {
      event: emailEvent,
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
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(201)

      const response = await testDestination.testAction('emailEvent', requestData)

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchSnapshot()
    })

    it('Should fail if missing field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(201)

      const badData = {
        event: emailEvent,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        useDefaultMappings: true
      }

      await expect(testDestination.testAction('emailEvent', badData)).rejects.toThrowError(
        "The root value is missing the required field 'event_action'."
      )
    })

    it('Should handle 400 error (bad body)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(400)

      await expect(testDestination.testAction('emailEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 401 error (no auth)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(401)

      await expect(testDestination.testAction('emailEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 429 error (rate limit)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(429)

      await expect(testDestination.testAction('emailEvent', requestData)).rejects.toThrowError()
    })
  })

  describe('performBatch', () => {
    const emailEvents = [
      createTestEvent({
        type: 'track',
        event: 'Email Opened',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'some_audience_name',
            computation_id: 'abc'
          },
          traits: {
            email: 'test.email@test.com'
          }
        },
        traits: {
          email: 'test.email@test.com',
          optimizely_vuid: 'vuid identifier'
        },
        properties: {
          email: 'test.email@test.com',
          campaign_id: '123456',
          campaign_name: 'opti-test-campaign',
          link_url: 'https://url-from-email-clicked.com'
        }
      }),
      createTestEvent({
        type: 'track',
        event: 'Email Opened',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'some_audience_name',
            computation_id: 'abc'
          },
          traits: {
            email: 'test.email1@test.com'
          }
        },
        traits: {
          email: 'test.email1@test.com',
          optimizely_vuid: 'vuid identifier'
        },
        properties: {
          email: 'test.email1@test.com',
          campaign_id: '678910',
          campaign_name: 'opti-test-campaign',
          link_url: 'https://url-from-email-clicked.com'
        }
      })
    ]

    const requestData = {
      events: emailEvents,
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
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(201)

      const response = await testDestination.testBatchAction('emailEvent', requestData)

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchSnapshot()
    })

    it('Should return empty array if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(201)

      const badData = {
        events: emailEvents,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        useDefaultMappings: true
      }

      await expect(testDestination.testBatchAction('emailEvent', badData)).resolves.toEqual([])
    })

    it('Should handle 400 error (bad body)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(400)

      await expect(testDestination.testBatchAction('emailEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 401 error (no auth)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(401)

      await expect(testDestination.testBatchAction('emailEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 429 error (rate limit)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(429)

      await expect(testDestination.testBatchAction('emailEvent', requestData)).rejects.toThrowError()
    })
  })
})
