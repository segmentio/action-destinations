import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)

describe('OptimizelyAdvancedAudienceTargeting.syncAudience', () => {
  beforeEach((done) => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
    done()
  })

  describe('single request', () => {
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
      }
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
      nock('https://function.zaius.app/twilio_segment').post('/batch_sync_audience').reply(201)

      await expect(
        testDestination.testAction('syncAudience', {
          event: trackEvent,
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
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
