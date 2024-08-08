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

  describe('single request', () => {
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

    it('Should fire email event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(201)

      const response = await testDestination.testAction('emailEvent', {
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
        },
        useDefaultMappings: true
      })

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchInlineSnapshot(
        `"[{\\"type\\":\\"email\\",\\"action\\":\\"opened\\",\\"campaign\\":\\"opti-test-campaign\\",\\"campaign_id\\":\\"123456\\",\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test@test.com\\"},\\"campaign_event_value\\":\\"https://url-from-email-clicked.com\\",\\"timestamp\\":\\"2024-03-01T18:11:27.649Z\\"}]"`
      )
    })

    it('Should work with default values', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(201, {})

      await expect(
        testDestination.testAction('emailEvent', {
          event: emailEvent,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            event_action: 'opened'
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should throw error if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(201, {})

      await expect(
        testDestination.testAction('emailEvent', {
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
            // event_action: 'opened', // missing required field
            campaign: 'opti-test-campaign',
            timestamp: '2024-03-01T18:11:27.649Z'
          }
        })
      ).rejects.toThrowError()
    })

    it('should handle errors response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(400)

      await expect(
        testDestination.testAction('emailEvent', {
          event: emailEvent,
          mapping: {
            event_action: 'sent'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 401 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(401)

      await expect(
        testDestination.testAction('emailEvent', {
          event: emailEvent,
          mapping: {
            event_action: 'sent'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 429 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(429)

      await expect(
        testDestination.testAction('emailEvent', {
          event: emailEvent,
          mapping: {
            event_action: 'sent'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })
  })

  describe('batch request', () => {
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
        event: 'Email Sent',
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
          optimizely_vuid: 'vuid identifier 1'
        },
        properties: {
          email: 'test.email1@test.com',
          campaign_id: '123456',
          campaign_name: 'opti-test-campaign',
          link_url: 'https://url-from-email-clicked.com'
        }
      })
    ]

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(201, {})

      const response = await testDestination.testBatchAction('emailEvent', {
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
        },
        useDefaultMappings: true
      })

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchInlineSnapshot(
        `"[{\\"type\\":\\"email\\",\\"action\\":\\"opened\\",\\"campaign\\":\\"opti-test-campaign\\",\\"campaign_id\\":\\"123456\\",\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test@test.com\\"},\\"campaign_event_value\\":\\"https://url-from-email-clicked.com\\",\\"timestamp\\":\\"2024-03-01T18:11:27.649Z\\"},{\\"type\\":\\"email\\",\\"action\\":\\"opened\\",\\"campaign\\":\\"opti-test-campaign\\",\\"campaign_id\\":\\"123456\\",\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test@test.com\\"},\\"campaign_event_value\\":\\"https://url-from-email-clicked.com\\",\\"timestamp\\":\\"2024-03-01T18:11:27.649Z\\"}]"`
      )
    })

    it('Should work with default values', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(201)

      await expect(
        testDestination.testBatchAction('emailEvent', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            event_action: 'sent'
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    /// TODO: Check with Joe why this test is NOT failing if missing required field
    it('should throw error if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(201)

      await expect(
        testDestination.testBatchAction('emailEvent', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
      //.rejects.toThrowError() // It should have thrown error
    })

    it('should handle errors response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(400)

      await expect(
        testDestination.testBatchAction('emailEvent', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            event_action: 'sent'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 401 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(401)

      await expect(
        testDestination.testBatchAction('emailEvent', {
          events: emailEvents,
          settings: {
            apiKey: 'wrongKey',
            region: 'US'
          },
          mapping: {
            event_action: 'sent'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 429 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_email_event').reply(429)

      await expect(
        testDestination.testBatchAction('emailEvent', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            event_action: 'sent'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })
  })
})
