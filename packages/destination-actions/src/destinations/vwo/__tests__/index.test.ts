import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import type { Settings } from '../generated-types'

const testDestination = createTestIntegration(Destination)

describe('VWO AccountID Validation', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const settings: Settings = {
        vwoAccountId: 654331
      }
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should throw error for invalid AccountId', async () => {
      const settings: Settings = {
        vwoAccountId: 65431231
      }
      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })
})
