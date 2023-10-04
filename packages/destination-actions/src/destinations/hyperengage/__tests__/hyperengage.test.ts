import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import nock from 'nock'

export const apiKey = 'testApiKey'
export const workspaceIdentifier = 'testApiIdentifier'

const testDestination = createTestIntegration(Definition)
beforeAll(() => {
  nock.disableNetConnect()
})

afterAll(() => {
  nock.enableNetConnect()
  nock.cleanAll()
})

describe('Hyperengage', () => {
  describe('testAuthentication', () => {
    test('should validate workspaceIdentifier and apiKey', async () => {
      nock('https://api.hyperengage.io/api/v1/verify_api_key')
        .post(/.*/, {
          api_key: apiKey,
          workspace_identifier: workspaceIdentifier
        })
        .reply(200, { message: 'Mocked response' })
      await expect(testDestination.testAuthentication({ apiKey, workspaceIdentifier })).resolves.not.toThrowError()
    })
  })
})
