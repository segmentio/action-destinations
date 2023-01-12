import { createTestIntegration } from '@segment/actions-core'
import Ripe from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Ripe)

describe('Ripe', () => {
  describe('identify', () => {
    it('should validate action fields', async () => {
      try {
        await testDestination.testAction('identify', {
          settings: { apiKey: 'api-key' }
        })
      } catch (err) {
        expect(err).toBeDefined()
      }
    })

    it('should work', async () => {
      nock('https://api.getripe.com/core-backend').post('/identify').reply(200, {})

      const responses = await testDestination.testAction('identify', {
        mapping: { anonymousId: 'my-id', traits: {} },
        settings: { apiKey: 'api-key', endpoint: 'https://api.getripe.com/core-backend' }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toContain('my-id')
      expect(responses[0].options.body).toContain('traits')
    })
  })
})
