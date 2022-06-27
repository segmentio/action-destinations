import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Webhook from '../index'

const testDestination = createTestIntegration(Webhook)
const timestamp = new Date().toISOString()

describe('Webhook', () => {
  describe('send', () => {
    it('should work with default mapping', async () => {
      const url = 'https://example.com'
      const event = createTestEvent({
        timestamp,
        event: 'Test Event'
      })

      nock(url)
        .post('/', event as any)
        .reply(200)

      const responses = await testDestination.testAction('send', {
        event,
        mapping: {
          url
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('supports customizations', async () => {
      const url = 'https://example.build'
      const event = createTestEvent({
        timestamp,
        event: 'Test Event'
      })
      const headerField = 'Custom-Header'
      const headerValue = 'Custom-Value'
      const data = { cool: true }

      nock(url).put('/', data).matchHeader(headerField, headerValue).reply(200)

      const responses = await testDestination.testAction('send', {
        event,
        mapping: {
          url,
          method: 'PUT',
          headers: { [headerField]: headerValue },
          data
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
