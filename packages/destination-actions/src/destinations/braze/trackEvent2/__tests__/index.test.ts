import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Definition)

const settings: Settings = {
  api_key: 'test_api_key',
  app_id: 'test_app_id',
  endpoint: 'https://rest.iad-01.braze.com'
}

describe('Braze.trackEvent2 syncMode', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should set _update_existing_only to true when a valid syncMode of "update" is used', async () => {
    const event = createTestEvent({
      event: 'Test Event',
      type: 'track',
      userId: 'user-1',
      timestamp: '2024-06-10T12:00:00.000Z',
      properties: { plan: 'premium' }
    })

    nock(settings.endpoint).post('/users/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent2', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: { __segment_internal_sync_mode: 'update' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      events: [
        expect.objectContaining({
          external_id: 'user-1',
          name: 'Test Event',
          _update_existing_only: true
        })
      ]
    })
  })

  it('should set _update_existing_only to false when a valid syncMode of "add" is used', async () => {
    const event = createTestEvent({
      event: 'Test Event',
      type: 'track',
      userId: 'user-1',
      timestamp: '2024-06-10T12:00:00.000Z',
      properties: { plan: 'premium' }
    })

    nock(settings.endpoint).post('/users/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent2', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: { __segment_internal_sync_mode: 'add' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      events: [
        expect.objectContaining({
          external_id: 'user-1',
          name: 'Test Event',
          _update_existing_only: false
        })
      ]
    })
  })
})
