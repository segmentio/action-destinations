import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Qualtrics', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://testdc.qualtrics.com')
        .get('/API/v3/whoami')
        .matchHeader('x-api-token', 'VALID_API_TOKEN_VALUE')
        .reply(200, {
          result: {
            userName: 'abc'
          }
        })
      const authData = {
        apiToken: 'VALID_API_TOKEN_VALUE',
        datacenter: 'testdc'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('throw error when no API Token', async () => {
      nock('https://testdc.qualtrics.com').get('/API/v3/whoami').matchHeader('x-api-token', '').reply(400, {})
      const authData = {
        apiToken: '',
        datacenter: 'testdc'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(/400/)
    })

    it('throw error when API token invalid', async () => {
      nock('https://testdc.qualtrics.com').get('/API/v3/whoami').matchHeader('x-api-token', 'not-valid').reply(401, {})
      const authData = {
        apiToken: 'not-valid',
        datacenter: 'testdc'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(/401/)
    })
  })
})
