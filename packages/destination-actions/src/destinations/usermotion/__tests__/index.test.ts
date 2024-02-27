import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const endpoint = ' https://api.usermotion.com'

describe('User Motion', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(endpoint).post('/v1/verify').reply(200, {})

      await expect(testDestination.testAuthentication({ apiKey: 'TEST' })).resolves.not.toThrowError()
    })

    it('should fail authentication inputs', async () => {
      nock(endpoint).post('/v1/verify').reply(403, {
        code: 'AUTH_NOT_AUTHENTICATED',
        error: 'You are not logged in'
      })

      await expect(testDestination.testAuthentication({ apiKey: '000' })).rejects.toThrowError()
    })
  })
})
