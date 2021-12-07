import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Webhook from '../index'

const testDestination = createTestIntegration(Webhook)
const timestamp = new Date().toISOString()

describe('Webhook', () => {
  describe('send', () => {
    it('should work with default mapping', async () => {
      const url = 'https://mme-e2e.segment.com'
      const path = '/1234'
      const event = createTestEvent({
        timestamp,
        event: 'Test Event'
      })

      nock(url)
        .post(path, event as any)
        .reply(200)

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
      const url = 'https://mme-e2e.segment.build'
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

    it('supports customizations', async () => {
      const url = 'https://mme-e2e.segment.build'
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

    it('restricts usage to mme-e2e urls', async () => {
      const url = 'https://api.acme.com/webhook'
      const path = '/1234'
      const event = createTestEvent({
        timestamp,
        event: 'Test Event'
      })
      const data = { cool: true }

      nock(url).put(path, data).reply(200)

      try {
        await testDestination.testAction('send', {
          event,
          mapping: {
            url: url + path,
            method: 'PUT',
            data: { cool: true }
          }
        })
        fail('expected testAction to reject')
      } catch (err) {
        const error = err as IntegrationError
        expect(error.status).toBe(400)
        expect(error.code).toBe('Bad Request')
        expect(error.message).toBe("invalid url 'https://api.acme.com/webhook/1234'")
      }
    })
  })
})
