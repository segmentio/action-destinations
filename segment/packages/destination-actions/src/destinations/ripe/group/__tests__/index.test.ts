import { createTestIntegration } from '@segment/actions-core'
import Ripe from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Ripe)
describe('Ripe', () => {
  describe('group', () => {
    it('should validate action fields', async () => {
      try {
        await testDestination.testAction('group', {
          settings: { apiKey: 'api-key' }
        })
      } catch (err) {
        expect(err.message).toContain("missing the required field 'groupId'.")
      }
    })

    it('should work', async () => {
      nock('https://api.getripe.com/core-backend').post('/group').reply(200, {})

      const responses = await testDestination.testAction('group', {
        mapping: { anonymousId: 'my-anonymous-id', groupId: 'my-group-id' },
        settings: { apiKey: 'api-key', endpoint: 'https://api.getripe.com/core-backend' }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[0].options.body).toContain('my-anonymous-id')
      expect(responses[0].options.body).toContain('my-group-id')
    })
  })
})
