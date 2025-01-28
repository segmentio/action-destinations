import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'

import Definition from '../index'
import { Settings } from '../generated-types'
import { CONSTANTS } from '../constants'

const testDestination = createTestIntegration(Definition)

describe('Responsys Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(CONSTANTS.API_BASE_URL).post('/rest/api/v1.3/auth/token').reply(200, {
        authToken: 'anything',
        issuedAt: 1728492996097,
        endPoint: CONSTANTS.API_BASE_URL
      })

      const settings: Settings = {
        segmentWriteKey: 'testKey',
        username: 'testUser',
        userPassword: 'testPassword',
        baseUrl: CONSTANTS.API_BASE_URL,
        profileListName: 'TESTLIST',
        insertOnNoMatch: true,
        matchColumnName1: 'EMAIL_ADDRESS',
        updateOnMatch: 'REPLACE_ALL'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('createAudience', () => {
    it('should create an audience', async () => {})
  })

  describe('getAudience', () => {
    it('should get an audience', async () => {})
  })
})
