import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { algoliaApiPermissionsUrl } from '../algolia-insight-api'

const testDestination = createTestIntegration(Definition)

describe('Algolia Insights', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const settings = {
        appId: 'algolia-application-id',
        apiKey: 'algolia-api-key'
      }
      const authenticateUrl = algoliaApiPermissionsUrl(settings)

      nock(authenticateUrl.slice(0, authenticateUrl.indexOf('/1/')))
        .get('/1/keys/algolia-api-key')
        .reply(200, { acl: ['search'] })

      // there is no testAuthentication function for this destination so this just validates the authData schema
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should reject invalid credentials', async () => {
      const settings = {
        appId: 'algolia-application-id',
        apiKey: 'algolia-api-key'
      }
      const authenticateUrl = algoliaApiPermissionsUrl(settings)

      nock(authenticateUrl.slice(0, authenticateUrl.indexOf('/1/')))
        .get('/1/keys/algolia-api-key')
        .reply(403, {
          message: 'Invalid Application-ID or API key',
          status: 403
        })

      // there is no testAuthentication function for this destination so this just validates the authData schema
      await expect(testDestination.testAuthentication(settings)).rejects.toThrow()
    })

    it('should reject invalid acl', async () => {
      const settings = {
        appId: 'algolia-application-id',
        apiKey: 'algolia-api-key'
      }
      const authenticateUrl = algoliaApiPermissionsUrl(settings)

      nock(authenticateUrl.slice(0, authenticateUrl.indexOf('/1/')))
        .get('/1/keys/algolia-api-key')
        .reply(200, { acl: ['listIndexes'] })

      // there is no testAuthentication function for this destination so this just validates the authData schema
      await expect(testDestination.testAuthentication(settings)).rejects.toThrow()
    })
  })
})
