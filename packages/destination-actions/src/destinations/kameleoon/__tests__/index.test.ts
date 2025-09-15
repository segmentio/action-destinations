import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Definition from '../index'
import type { Settings } from '../generated-types'
import { BASE_URL } from '../properties'

const CLIENT_ID = 'CLIENT_ID'
const CLIENT_SECRET = 'CLIENT_SECRET'

const testDestination = createTestIntegration(Definition)

describe('Kameleoon', () => {
  describe('testAuthentication', () => {
    it('should validate cation inputs', async () => {
      nock(BASE_URL + '/getapikey')
        .get(/.*/)
        .reply(200, {})

      const apiKey = {
        id: CLIENT_ID,
        secret: CLIENT_SECRET
      }
      const authData: Settings = {
        apiKey: Buffer.from(JSON.stringify(apiKey)).toString('base64'),
        sitecode: '1q2w3e4r5t'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
    it('should throw error for invalid sitecode', async () => {
      const settings: Settings = {
        apiKey: '',
        sitecode: '1q2w3e4'
      }
      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })
})
