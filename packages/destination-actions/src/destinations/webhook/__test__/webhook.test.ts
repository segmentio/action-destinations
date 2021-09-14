import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Webhook from '../index'

const testDestination = createTestIntegration(Webhook)
const timestamp = new Date().toISOString()

describe('Webhook', () => {
  describe('send', () => {
    it('should work with default mapping', async () => {
      const url = 'https://my.webhook.com'
      const path = '/1234'
      const event = createTestEvent({
        timestamp,
        event: 'Test Event'
      })
      const eventObject = JSON.parse(JSON.stringify(event))

      nock(url).post(path, eventObject).reply(200)

      const responses = await testDestination.testAction('send', {
        event,
        mapping: {
          url: url + path
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('supports customizations', async () => {
      const url = 'https://my.webhook.com'
      const path = '/1234'
      const event = createTestEvent({
        timestamp,
        event: 'Test Event'
      })
      const data = { cool: true }

      nock(url).put(path, data).reply(200)

      const responses = await testDestination.testAction('send', {
        event,
        mapping: {
          url: url + path,
          method: 'PUT',
          data: { cool: true }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
