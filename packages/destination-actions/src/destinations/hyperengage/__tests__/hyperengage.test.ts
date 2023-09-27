import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

export const apiKey = 'testApiKey'
export const workspaceIdentifier = 'testApiIdentifier'

const testDestination = createTestIntegration(Definition)

describe('Hyperengage', () => {
  describe('testAuthentication', () => {
    it('should validate workspaceIdentifier and apiKey', async () => {
      await expect(testDestination.testAuthentication({ apiKey, workspaceIdentifier })).resolves.not.toThrowError()
    })
  })
})
