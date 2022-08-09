import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Pardot', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://your.destination.endpoint').get('*').reply(200, {})

      // This should match your authentication.fields
      //const authData = {}
      //TODO
      testDestination
      //await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
