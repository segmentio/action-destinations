import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL, TIKTOK_API_VERSION } from '../../constants'

const testDestination = createTestIntegration(Destination)

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

const auth: AuthTokens = {
  accessToken: 'test',
  refreshToken: 'test'
}

const event = createTestEvent({
  event: 'Create Audience',
  type: 'track'
})

const createAudienceRequestBody = {
  custom_audience_name: 'personas_test_audience',
  advertiser_id: '123',
  id_type: 'EMAIL_SHA256',
  action: 'create'
}

describe('TiktokAudiences.createAudience', () => {
  it('should successfully create a new audience', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/audience/`)
      .post(/.*/, createAudienceRequestBody)
      .reply(200, { data: { audience_id: '1234345' } })

    await expect(
      testDestination.testAction('createAudience', {
        event,
        settings: {
          advertiser_ids: ['123']
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          selected_advertiser_id: '123',
          custom_audience_name: 'personas_test_audience',
          id_type: 'EMAIL_SHA256'
        }
      })
    ).resolves.not.toThrowError()
  })
})
