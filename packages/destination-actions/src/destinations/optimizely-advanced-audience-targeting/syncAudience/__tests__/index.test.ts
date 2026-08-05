import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import isEqual from 'lodash/isEqual'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)

describe('OptimizelyAdvancedAudienceTargeting.syncAudience', () => {
  beforeEach((done) => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
    done()
  })

  describe('single request', () => {
    // Expected request body for trackEvent / trackEventJourneyStep below. segment_computation_action
    // (populated from computation_class) is only used as a gate on the field's `choices` - it is not
    // referenced when building the OptimizelyClient request body, so an 'audience' payload and an
    // otherwise-identical 'journey_step' payload produce an identical request body.
    const expectedTrackBody = [
      {
        audienceId: 'abc',
        audienceName: 'some_audience_name',
        timestamp: '2024-01-08T13:52:50.212Z',
        subscription: true,
        userId: 'user1234'
      }
    ]
    const trackEvent = createTestEvent({
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
        some_audience_name: true
      },
      timestamp: '2024-01-08T13:52:50.212Z'
    })
    const trackEventJourneyStep = createTestEvent({
      context: {
        personas: {
          computation_class: 'journey_step',
          computation_key: 'some_audience_name',
          computation_id: 'abc'
        },
        traits: {
          email: 'test.email@test.com'
        }
      },
      traits: {
        email: 'test.email@test.com',
        some_audience_name: true
      },
      timestamp: '2024-01-08T13:52:50.212Z'
    })
    const identifyEvent = createTestEvent({
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: 'some_audience_name',
          computation_id: 'abc'
        }
      },
      properties: {
        audience_key: 'some_audience_name',
        some_audience_name: true
      }
    })

    it('should handle traits with track', async () => {
      nock('https://function.zaius.app/twilio_segment')
        .post('/batch_sync_audience', (body) => isEqual(body, expectedTrackBody))
        .reply(201)

      const responses = await testDestination.testAction('syncAudience', {
        event: trackEvent,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('should handle traits with track (journey_step)', async () => {
      nock('https://function.zaius.app/twilio_segment')
        .post('/batch_sync_audience', (body) => isEqual(body, expectedTrackBody))
        .reply(201)

      const responses = await testDestination.testAction('syncAudience', {
        event: trackEventJourneyStep,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('should handle props with track', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_sync_audience').reply(201)

      await expect(
        testDestination.testAction('syncAudience', {
          event: identifyEvent,
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should reject event when optimizelyUserId is null', async () => {
      await expect(
        testDestination.testAction('syncAudience', {
          event: trackEvent,
          useDefaultMappings: true,
          mapping: {
            optimizelyUserId: null
          }
        })
      ).rejects.toThrowError()
    })

    it('should handle errors response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_sync_audience').reply(400)

      await expect(
        testDestination.testAction('syncAudience', {
          event: identifyEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 401 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_sync_audience').reply(401)

      await expect(
        testDestination.testAction('syncAudience', {
          event: identifyEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })
  })

  describe('batch request', () => {
    const trackEvents = [
      createTestEvent({
        traits: {
          email: 'test.email@test.com',
          some_audience_name: true
        }
      }),
      createTestEvent({
        traits: {
          email: 'test1.email@test.com',
          some_audience_name: true
        }
      })
    ]
    const identifyEvents = [
      createTestEvent({
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'some_audience_name',
            computation_id: 'abc'
          }
        },
        properties: {
          audience_key: 'some_audience_name',
          some_audience_name: true
        }
      }),
      createTestEvent({
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'some_audience_name1',
            computation_id: 'abc1'
          }
        },
        properties: {
          audience_key: 'some_audience_name1',
          some_audience_name: true
        }
      })
    ]

    it('should handle traits with track', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_sync_audience').reply(201)

      await expect(
        testDestination.testBatchAction('syncAudience', {
          events: trackEvents,
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should handle props with track', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_sync_audience').reply(201)

      await expect(
        testDestination.testBatchAction('syncAudience', {
          events: identifyEvents,
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should reject events when optimizelyUserId is null', async () => {
      await testDestination.testBatchAction('syncAudience', {
        events: identifyEvents,
        useDefaultMappings: true,
        mapping: {
          optimizelyUserId: null
        }
      })

      const multiStatus = testDestination.results[0].multistatus
      expect(multiStatus).toBeDefined()
      expect(multiStatus?.every((r) => r.status === 400)).toBe(true)
    })

    it('should handle errors response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_sync_audience').reply(400)

      await expect(
        testDestination.testBatchAction('syncAudience', {
          events: identifyEvents,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 401 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_sync_audience').reply(401)

      await expect(
        testDestination.testBatchAction('syncAudience', {
          events: identifyEvents,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })
  })
})
