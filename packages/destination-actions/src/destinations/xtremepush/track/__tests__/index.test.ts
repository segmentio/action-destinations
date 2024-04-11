import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const auth = {
  url: 'https://api.xtremepush.com',
  apiKey: 'TestingAPIKey'
}

describe('XtremepushActionsDestination.track', () => {
  describe('test Track event', () => {
    it('should work', async () => {
      nock('https://api.xtremepush.com').post('/api/integration/segment/handle').reply(200, {})

      const event = createTestEvent()

      const responses = await testDestination.testAction('track', {
        event,
        useDefaultMappings: true,
        settings: {
          ...auth
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
