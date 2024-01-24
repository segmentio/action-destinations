import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Google Analytics 4', () => {
  describe('testAuthentication', () => {
    it('should not throw error when Measurement ID is provided but Firebase App ID is not provided', async () => {
      await expect(
        testDestination.testAuthentication({ apiSecret: 'apiSecret', measurementId: 'G-M12312' })
      ).resolves.not.toThrowError()
    })
    it('should not throw error when Firebase App ID is provided but Measurement ID is not provided', async () => {
      await expect(
        testDestination.testAuthentication({ apiSecret: 'apiSecret', firebaseAppId: 'G:android:M12312' })
      ).resolves.not.toThrowError()
    })
    it('should throw error when both Firebase App ID and Measurement ID are not provided', async () => {
      await expect(testDestination.testAuthentication({ apiSecret: 'apiSecret' })).rejects.toThrowError(
        'One of Firebase App ID (Mobile app Stream) or Measurement ID (Web Stream) is required'
      )
    })
  })
})
