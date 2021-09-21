import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'

describe('Mixpanel.trackEvent', () => {
  // TODO: Test your action
  it('should validate action fields', async () => {
    try {
      await testDestination.testAction('trackEvent', {
        settings: { apiSecret: MIXPANEL_API_SECRET, projectToken: MIXPANEL_PROJECT_TOKEN }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'name'.")
    }
  })

  it('should work', async () => {
    createTestEvent({
      properties: {}
    })
    nock('https://api.mixpanel.com').post('/import?strict=1')

    await testDestination.testAction('trackEvent', {})
  })
})
