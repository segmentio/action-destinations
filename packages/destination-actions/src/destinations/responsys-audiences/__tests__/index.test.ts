import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'

import Definition from '../index'
import { Settings } from '../generated-types'

const responsysHost = 'https://123456-api.responsys.ocs.oraclecloud.com'

const testDestination = createTestIntegration(Definition)

jest.setTimeout(10000)

describe('Responsys Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(responsysHost).post('/rest/api/v1.3/auth/token').reply(200, {
        authToken: 'anything',
        issuedAt: 1728492996097,
        endPoint: responsysHost
      })

      const settings: Settings = {
        segmentWriteKey: 'testKey',
        username: 'testUser',
        userPassword: 'testPassword',
        baseUrl: responsysHost,
        profileListName: 'TESTLIST',
        insertOnNoMatch: true,
        matchColumnName1: 'EMAIL_ADDRESS',
        updateOnMatch: 'REPLACE_ALL'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('createAudience', () => {
    const profileListName = 'TESTLIST'
    it('should create an audience successfully', async () => {
      nock(responsysHost).post('/rest/api/v1.3/auth/token').reply(200, {
        authToken: 'anything',
        issuedAt: 1728492996097,
        endPoint: responsysHost
      })

      nock(responsysHost).get(`/rest/api/v1.3/lists/${profileListName}/listExtensions`).reply(200, [])
      nock(responsysHost).post(`/rest/api/v1.3/lists/${profileListName}/listExtensions`).reply(200, {})

      const settings: Settings = {
        segmentWriteKey: 'testKey',
        username: 'testUser',
        userPassword: 'testPassword',
        baseUrl: responsysHost,
        profileListName: profileListName,
        insertOnNoMatch: true,
        matchColumnName1: 'EMAIL_ADDRESS',
        updateOnMatch: 'REPLACE_ALL'
      }

      const createAudienceInput = {
        settings,
        audienceName: 'Test Audience',
        personas: {
          computation_key: 'test_audience',
          computation_id: '12342352452562',
          namespace: 'spa_12312414212412'
        }
      }

      const audienceResult = await testDestination.createAudience(createAudienceInput)
      expect(audienceResult).toBeTruthy()
      expect(audienceResult.externalId).toBe('test_audience')
    })
  })

  describe('getAudience', () => {
    const profileListName = 'TESTLIST'
    it('should get an audience', async () => {
      nock(responsysHost).post('/rest/api/v1.3/auth/token').reply(200, {
        authToken: 'anything',
        issuedAt: 1728492996097,
        endPoint: responsysHost
      })

      nock(responsysHost)
        .get(`/rest/api/v1.3/lists/${profileListName}/listExtensions`)
        .reply(200, [
          {
            profileExtension: {
              objectName: 'test_audience'
            }
          }
        ])

      const settings: Settings = {
        segmentWriteKey: 'testKey',
        username: 'testUser',
        userPassword: 'testPassword',
        baseUrl: responsysHost,
        profileListName: profileListName,
        insertOnNoMatch: true,
        matchColumnName1: 'EMAIL_ADDRESS',
        updateOnMatch: 'REPLACE_ALL'
      }

      const getAudienceResult = await testDestination.getAudience({ settings, externalId: 'test_audience' })
      expect(getAudienceResult).toBeTruthy()
      expect(getAudienceResult.externalId).toBe('test_audience')
    })
  })
})
