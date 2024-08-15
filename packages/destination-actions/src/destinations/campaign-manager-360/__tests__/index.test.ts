import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Campaign Manager 360', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://your.destination.endpoint').get('*').reply(200, {})

      // For now we won't need this.
      // This is just a placeholder to test the authentication function.
      const authData = {
        profileId: '12345',
        defaultFloodlightActivityId: '23456',
        defaultFloodlightConfigurationId: '34567'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
