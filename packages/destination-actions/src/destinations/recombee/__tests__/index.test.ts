import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const DATABASE_ID = 'test-database'

describe('Recombee', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://rapi-eu-west.recombee.com/')
        .post(`/${DATABASE_ID}/batch/`)
        .query({
          hmac_timestamp: /.*/,
          hmac_sign: /.*/
        })
        .reply(200, [])

      const authData: Settings = {
        privateToken: 'VALID_TOKEN',
        databaseId: DATABASE_ID,
        databaseRegion: 'eu-west'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should throw error when no API Key', async () => {
      nock('https://rapi-eu-west.recombee.com/')
        .post(`/${DATABASE_ID}/batch/`)
        .query({
          hmac_timestamp: /.*/,
          hmac_sign: /.*/
        })
        .reply(401, [])

      const authData: Settings = {
        privateToken: '',
        databaseId: DATABASE_ID,
        databaseRegion: 'eu-west'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(/401/)
    })

    it('should throw error when API Key invalid', async () => {
      nock('https://rapi-eu-west.recombee.com/')
        .post(`/${DATABASE_ID}/batch/`)
        .query({
          hmac_timestamp: /.*/,
          hmac_sign: /.*/
        })
        .reply(401, [])

      const authData: Settings = {
        privateToken: 'INVALID_TOKEN',
        databaseId: DATABASE_ID,
        databaseRegion: 'eu-west'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(/401/)
    })
  })
})
