import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { settings, devUserSelfResponse } from '../mocks'

const testDestination = createTestIntegration(Definition)

describe('DevRev', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.devrev.ai').get('/dev-users.self').reply(200, devUserSelfResponse)

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrow()
    })
  })
})
