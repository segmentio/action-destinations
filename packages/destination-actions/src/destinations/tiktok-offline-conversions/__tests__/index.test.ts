import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Tiktok Offline Conversions', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      // TODO: Test your action. code below is just to allow Linter to pass
      const event = createTestEvent({
        userId: 'testId123'
      })
      expect(event.userId).toBe('testId123')

      nock('https://your.destination.endpoint').get('*').reply(200, {})

      // This should match your authentication.fields
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
