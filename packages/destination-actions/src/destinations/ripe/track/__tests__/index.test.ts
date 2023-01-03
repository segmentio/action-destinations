import { createTestIntegration } from '@segment/actions-core'
import Ripe from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Ripe)

describe('Ripe', () => {
  describe('track', () => {
    it('should validate action fields', async () => {
      try {
        await testDestination.testAction('track', {
          settings: { apiKey: 'api-key' }
        })
      } catch (err) {
        expect(err.message).toContain("missing the required field 'anonymousId'.")
        expect(err.message).toContain("missing the required field 'event'.")
      }
    })

    it('should work', async () => {
      nock('https://core-backend-dot-production-365112.ey.r.appspot.com').post('/api/track').reply(200, {})

      const responses = await testDestination.testAction('track', {
        mapping: { anonymousId: 'my-id', event: 'event-name' },
        settings: { apiKey: 'api-key' }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toContain('my-id')
      expect(responses[0].options.body).toContain('event-name')
    })
  })
})
