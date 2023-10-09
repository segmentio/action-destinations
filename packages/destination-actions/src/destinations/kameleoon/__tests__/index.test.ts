import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import type { Settings } from '../generated-types'

const CLIENT_ID = 'CLIENT_ID'
const CLIENT_SECRET = 'CLIENT_SECRET'

const testDestination = createTestIntegration(Definition)

describe('Kameleoon', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const apiKey = {
        id: CLIENT_ID,
        secret: CLIENT_SECRET
      }
      const authData: Settings = {
        apiKey: Buffer.from(JSON.stringify(apiKey)).toString('base64'),
        sitecode: '1q2w3e4r5t'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
    it('should throw error for invalid sitecode', async () => {
      const settings: Settings = {
        apiKey: '',
        sitecode: '1q2w3e4'
      }
      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })
})
