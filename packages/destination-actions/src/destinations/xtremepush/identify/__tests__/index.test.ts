import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const auth = {
  url: 'https://api.xtremepush.com',
  apiKey: 'TestingAPIKey'
}

describe('XtremepushActionsDestination.identify', () => {
  describe('test Identify event', () => {
    it('should work', async () => {
      nock('https://api.xtremepush.com').post('/api/integration/segment/handle').reply(200, {})

      const event = createTestEvent({
        type: 'identify',
        userId: 'TestUserID'
      })

      const responses = await testDestination.testAction('identify', {
        event,
        settings: {
          ...auth
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
