import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Survicate Cloud Mode', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://panel-api.survicate.com')
        .get('/integrations-api/endpoint/segment/check')
        .reply(200, { success: true })

      const authData = {
        workspaceKey: 'test-workspace-key',
        apiKey: 'test-api-key'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should handle authentication failure', async () => {
      nock('https://panel-api.survicate.com')
        .get('/integrations-api/endpoint/segment/check')
        .reply(401, { error: 'Unauthorized' })

      const authData = {
        workspaceKey: 'invalid-workspace-key',
        apiKey: 'invalid-api-key'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrow()
    })
  })
})
