import { createTestIntegration } from '@segment/actions-core'
import Ripe from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Ripe)

describe('Ripe', () => {
  describe('page', () => {
    it('should validate action fields', async () => {
      nock('https://api.getripe.com/core-backend').post('/page').reply(200, {})
      try {
        await testDestination.testAction('page', {
          settings: { apiKey: 'api-key', endpoint: 'https://api.getripe.com/core-backend' }
        })
      } catch (err) {
        expect(err.message).toContain("missing the required field 'properties'.")
        expect(err.message).toContain("missing the required field 'name'.")
      }
    })

    it('should work', async () => {
      nock('https://api.getripe.com/core-backend').post('/page').reply(200, {})

      const responses = await testDestination.testAction('page', {
        mapping: { anonymousId: 'my-id', properties: {}, name: 'page-name' },
        settings: { apiKey: 'api-key', endpoint: 'https://api.getripe.com/core-backend' }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toContain('my-id')
      expect(responses[0].options.body).toContain('properties')
      expect(responses[0].options.body).toContain('page-name')
    })
  })
})
