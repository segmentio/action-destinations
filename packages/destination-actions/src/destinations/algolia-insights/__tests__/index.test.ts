import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { algoliaApiPermissionsUrl } from '../algolia-insight-api'

const testDestination = createTestIntegration(Definition)

describe('Algolia Insights', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const settings = {
        appId: 'ABCDE12345',
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
        appId: 'ABCDE12345',
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

    it('should reject a malicious appId containing path injection characters', () => {
      const settings = {
        appId: 'evil.attacker.com/path?x=',
        apiKey: 'algolia-api-key'
      }
      expect(() => algoliaApiPermissionsUrl(settings)).toThrow('Provide Valid Alphanumeric Application ID.')
    })

    it('should accept a valid 10-character alphanumeric appId', () => {
      const settings = {
        appId: 'ABCDE12345',
        apiKey: 'algolia-api-key'
      }
      expect(() => algoliaApiPermissionsUrl(settings)).not.toThrow()
    })

    it('should reject an appId shorter than 10 characters', () => {
      const settings = {
        appId: 'ABCD1234',
        apiKey: 'algolia-api-key'
      }
      expect(() => algoliaApiPermissionsUrl(settings)).toThrow('Provide Valid Alphanumeric Application ID.')
    })

    it('should reject an appId longer than 10 characters', () => {
      const settings = {
        appId: 'ABCDE123456',
        apiKey: 'algolia-api-key'
      }
      expect(() => algoliaApiPermissionsUrl(settings)).toThrow('Provide Valid Alphanumeric Application ID.')
    })

    it('should reject an appId with special characters', () => {
      const settings = {
        appId: 'ABCD!@#$%^',
        apiKey: 'algolia-api-key'
      }
      expect(() => algoliaApiPermissionsUrl(settings)).toThrow('Provide Valid Alphanumeric Application ID.')
    })

    it('should reject invalid acl', async () => {
      const settings = {
        appId: 'ABCDE12345',
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
