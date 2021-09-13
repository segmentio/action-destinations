import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Webhook from '../index'

const testDestination = createTestIntegration(Webhook)
const timestamp = new Date().toISOString()

describe('Webhook', () => {
  describe('postJSON', () => {
    it('should work with default mapping', async () => {
      const url = 'https://my.webhook.com/1234'
      const path = '/1234'
      const event = createTestEvent({
        timestamp,
        event: 'Test Event'
      })

      nock(url).post(path).reply(200)

      const responses = await testDestination.testAction('postJSON', {
        event,
        mapping: {
          url: url + path
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
