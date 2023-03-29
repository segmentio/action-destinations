import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { baseURL } from '../request-params'

const testDestination = createTestIntegration(Definition)

describe('Gwen', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(baseURL).post('').reply(200, { data: {} })

      const authData = {
        apiKey: 'my-api-key'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('invalid api token', async () => {
      nock(baseURL)
        .post('')
        .reply(200, { data: { errors: [{ message: "Access Denied!  You don't have permission for this action!" }] } })

      const authData = {
        apiKey: 'no-api-key'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
