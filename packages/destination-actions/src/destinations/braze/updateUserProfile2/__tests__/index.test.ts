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

describe('Braze.updateUserProfile2 syncMode', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should succeed with a valid syncMode of "update" and mark _update_existing_only as true', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'user-1',
      traits: { email: 'test@example.com', firstName: 'Tony' }
    })

    nock(settings.endpoint).post('/users/track').reply(200, {})

    const responses = await testDestination.testAction('updateUserProfile2', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: { __segment_internal_sync_mode: 'update' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      attributes: [
        expect.objectContaining({
          external_id: 'user-1',
          email: 'test@example.com',
          _update_existing_only: true
        })
      ]
    })
  })
})
