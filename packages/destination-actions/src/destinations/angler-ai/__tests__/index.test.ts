import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { baseURL } from '../routes'

const testDestination = createTestIntegration(Definition)

describe('Angler Ai', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const authResponse = {
        sub: 'test_workspace_id',
        scopes: 'DATA_ADMIN'
      }

      nock(baseURL).get('/v1/me').reply(200, authResponse)

      const authData = {
        accessToken: 'test_token',
        workspaceId: 'test_workspace_id'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
