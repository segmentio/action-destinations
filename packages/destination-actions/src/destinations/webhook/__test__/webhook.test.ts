import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Webhook from '../index'
import { createHmac } from 'crypto'

const testDestination = createTestIntegration(Webhook)

describe('Webhook', () => {
  describe('send', () => {
    it('should work with default mapping', async () => {
      const url = 'https://example.com'
      const event = createTestEvent()

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
      const event = createTestEvent()
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

    it('supports request signing', async () => {
      const url = 'https://example.com'
      const event = createTestEvent({
        properties: { cool: true }
      })
      const payload = event.properties
      const sharedSecret = 'abc123'

      const digest = createHmac('sha1', sharedSecret).update(JSON.stringify(payload), 'utf8').digest('hex')

      nock(url)
        .matchHeader('x-signature', digest)
        .post('/', payload as any)
        .reply(200)

      const responses = await testDestination.testAction('send', {
        event,
        mapping: {
          url,
          data: { '@path': '$.properties' }
        },
        settings: { sharedSecret },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
