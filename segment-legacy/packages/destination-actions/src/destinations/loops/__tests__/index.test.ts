import nock from 'nock'
import { createTestIntegration, DecoratedResponse } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const LOOPS_API_KEY = 'some random secret'

describe('Loops', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://app.loops.so/api/v1/api-key')
        .get(/.*/)
        .matchHeader('authorization', `Bearer ${LOOPS_API_KEY}`)
        .reply(200, {
          success: true
        })

      const authData = {
        apiKey: LOOPS_API_KEY
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
  describe('deletes', () => {
    it('should support gdpr deletes', async () => {
      nock('https://app.loops.so/api/v1').post('/contacts/delete').reply(200, {})
      if (testDestination.onDelete) {
        const response = await testDestination.onDelete(
          { type: 'track', userId: 'sloth@segment.com' },
          { apiKey: LOOPS_API_KEY }
        )
        const resp = response as DecoratedResponse
        expect(resp.status).toBe(200)
      }
    })
  })
})
