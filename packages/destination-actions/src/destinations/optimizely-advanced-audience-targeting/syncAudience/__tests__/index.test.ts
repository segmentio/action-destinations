import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('OptimizelyAdvancedAudienceTargeting.syncAudience', () => {
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
      },
      properties: {
        audience_key: 'some_audience_name',
        some_audience_name: true
      }
    }
  })

  it('should handle props with track', async () => {
    nock('https://function.zaius.app/twilio_segment').post('/event_import').reply(201)

    await expect(
      testDestination.testAction('syncAudience', {
        event: trackEvent,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should handle traits with track', async () => {
    nock('https://function.zaius.app/twilio_segment').post('/event_import').reply(201)

    await expect(
      testDestination.testAction('syncAudience', {
        event: identifyEvent,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })
})
