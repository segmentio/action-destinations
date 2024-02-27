import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)

describe('Responsys', () => {
  describe('testAuthentication', () => {
    it('should validate settings correctly', async () => {
      const settings: Settings = {
        segmentWriteKey: 'testKey',
        username: 'testUser',
        userPassword: 'testPassword',
        baseUrl: 'https://example.com',
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
