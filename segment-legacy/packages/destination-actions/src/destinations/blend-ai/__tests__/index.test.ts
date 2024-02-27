import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const baseUrl = 'https://segment-api.blnd.ai/'
const testDestination = createTestIntegration(Definition)

describe('Blend AI', () => {
  describe('testAuthentication', () => {
    it('should throw an error in case of invalid client secret key', async () => {
      nock(baseUrl).post('/authentication').reply(401, {})

      const authData = {
        settings: {
          apiKey: 'abc123'
        }
      }

      await expect(testDestination.testAuthentication(authData.settings)).rejects.toThrowError()
    })

    it('should not throw an error when settings is appropriate and api gives sucess', async () => {
      nock(baseUrl).post('/authenticate').reply(200, {})

      const authData = {
        settings: {
          apiKey: 'bac1234'
        }
      }
      await expect(testDestination.testAuthentication(authData.settings)).resolves.not.toThrowError()
    })
  })
})
