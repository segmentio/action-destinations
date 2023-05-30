import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import destination from '../index'

const testDestination = createTestIntegration(destination)

describe('Devrev Test', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://your.destination.endpoint').get('*').reply(200, {})

      // This should match your authentication.fields
      const settings = {
        devOrgId: "DEV-xyz",
        apiKey : "czvzbzb",
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
