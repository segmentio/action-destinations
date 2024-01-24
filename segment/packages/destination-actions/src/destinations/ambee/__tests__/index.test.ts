import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Ambee', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://segment-api.ambeedata.com').post('/v1/company-info').reply(200, {})

      const settings = {
        companyName: 'test_company_name',
        apiKey: 'test_api_key',
        email: 'test@test.com',
        segmentRegion: 'US',
        segmentWriteKey: '123456789'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
