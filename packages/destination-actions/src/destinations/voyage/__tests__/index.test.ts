import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import type {Settings} from '../generated-types'

const testDestination = createTestIntegration(Destination)

describe('Voyage', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      // This should match your authentication.fields
      const settings: Settings = {
        apiKey: 'api-key-123'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
