import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Webhook from '../index'

const testDestination = createTestIntegration(Webhook)
const timestamp = new Date().toISOString()

describe('Webhook', () => {
  describe('send', () => {
    it('should work with default mapping', async () => {
      const url = 'https://mme-e2e.segment.com'
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
      const url = 'https://mme-e2e.segment.build'

      const event = createTestEvent({
        timestamp,
        event: 'Test Event'
      })
      const data = { cool: true }

      nock(url).put('/', data).reply(200)

      const responses = await testDestination.testAction('send', {
        event,
        mapping: {
          url,
          method: 'PUT',
          data: { cool: true }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('supports customizations', async () => {
      const url = 'https://mme-e2e.segment.build'
      const event = createTestEvent({
        timestamp,
        event: 'Test Event'
      })
      const data = { cool: true }

      nock(url).put('/', data).reply(200)

      const responses = await testDestination.testAction('send', {
        event,
        mapping: {
          url,
          method: 'PUT',
          data: { cool: true }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('restricts usage to mme-e2e urls', async () => {
      const url = 'https://api.acme.com/webhook'
      const event = createTestEvent({
        timestamp,
        event: 'Test Event'
      })
      const data = { cool: true }

      nock(url).put('/', data).reply(200)

      try {
        await testDestination.testAction('send', {
          event,
          mapping: {
            url,
            method: 'PUT',
            data: { cool: true }
          }
        })
        fail('expected testAction to reject')
      } catch (err) {
        const error = err as IntegrationError
        expect(error.status).toBe(400)
        expect(error.code).toBe('Bad Request')
        expect(error.message).toBe("invalid url 'https://api.acme.com/webhook'")
      }
    })
  })
})
