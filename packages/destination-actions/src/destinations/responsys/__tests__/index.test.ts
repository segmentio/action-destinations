import nock from 'nock'

import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)

describe('Responsys', () => {
  describe('testAuthentication', () => {
    it('should validate settings correctly', async () => {
      nock('https://instance-api.responsys.ocs.oraclecloud.com').post('/rest/api/v1.3/auth/token').reply(200, {
        authToken: 'anything',
        issuedAt: 1728492996097,
        endPoint: 'https://cj01qwy-api.responsys.ocs.oraclecloud.com'
      })

      const settings: Settings = {
        segmentWriteKey: 'testKey',
        username: 'testUser',
        userPassword: 'testPassword',
        baseUrl: 'https://instance-api.responsys.ocs.oraclecloud.com',
        profileListName: 'TESTLIST',
        insertOnNoMatch: true,
        matchColumnName1: 'EMAIL_ADDRESS',
        updateOnMatch: 'REPLACE_ALL',
        defaultPermissionStatus: 'OPTOUT'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
