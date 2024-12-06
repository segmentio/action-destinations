import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Definition from '../index'
import { GQL_ENDPOINT } from '../functions'

const testDestination = createTestIntegration(Definition)

describe('StackAdapt Audiences - Destination Tests', () => {
  const mockSettings = { apiKey: 'test-api-key' }
  const gqlHostUrl = 'https://api.stackadapt.com'

  afterEach(() => {
    nock.cleanAll()
  })

  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(GQL_ENDPOINT, {
        reqheaders: {
          authorization: `Bearer ${mockSettings.apiKey}`,
          'content-type': 'application/json'
        }
      })
        .post('', {
          query: /tokenInfo/
        })
        .reply(200, {
          data: {
            tokenInfo: {
              scopesByAdvertiser: {
                nodes: [
                  {
                    advertiser: { name: 'Test Advertiser' },
                    scopes: ['WRITE']
                  }
                ]
              }
            }
          }
        })

      await expect(testDestination.testAuthentication(mockSettings)).resolves.not.toThrowError()
    })

    it('should fail if authentication is invalid', async () => {
      nock(GQL_ENDPOINT).post('').reply(403, {})

      await expect(testDestination.testAuthentication(mockSettings)).rejects.toThrowError('403Forbidden')
    })
  })

  describe('onDelete', () => {
    it('should delete a user with a given userId', async () => {
      const userId = '9999'
      const event = createTestEvent({ userId, type: 'identify' })

      // Mock the GraphQL deleteProfilesWithExternalIds mutation
      nock(gqlHostUrl)
        .post('/graphql', (body) => {
          return body.query.includes('deleteProfilesWithExternalIds') && body.query.includes(userId)
        })
        .reply(200, {
          data: { deleteProfilesWithExternalIds: { userErrors: [] } }
        })

      const response = await testDestination.onDelete!(event, {
        apiKey: 'test-api-key'
      })

      expect(response).toMatchObject({
        data: { deleteProfilesWithExternalIds: { userErrors: [] } }
      })
    })

    it('should throw an error if profile deletion fails with userErrors', async () => {
      const userId = '9999'
      const event = createTestEvent({ userId, type: 'identify' })

      // Mock the GraphQL deleteProfilesWithExternalIds mutation with an error
      nock(gqlHostUrl)
        .post('/graphql')
        .reply(200, {
          data: {
            deleteProfilesWithExternalIds: {
              userErrors: [{ message: 'Deletion failed' }]
            }
          }
        })

      await expect(
        testDestination.onDelete!(event, {
          apiKey: 'test-api-key'
        })
      ).rejects.toThrowError('Profile deletion was not successful: Deletion failed')
    })
  })
})
