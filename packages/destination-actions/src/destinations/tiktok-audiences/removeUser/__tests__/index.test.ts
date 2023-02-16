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
  event: 'Audience Exited',
  type: 'track',
  properties: {
    audience_key: 'personas_test_audience'
  },
  context: {
    device: {
      advertisingId: '123'
    },
    traits: {
      email: 'testing@testing.com'
    }
  }
})

const urlParams = {
  advertiser_id: '123',
  page: 1,
  page_size: 100
}

const updateUsersRequestBody = {
  advertiser_ids: ['123'],
  action: 'delete',
  data: [
    {
      id_type: 'EMAIL_SHA256',
      id: '44d206f60172cd898051a9fb2174750aee1eca00f6f63f12801b90644321e342',
      audience_ids: ['1234345']
    }
  ]
}

const createAudienceRequestBody = {
  custom_audience_name: 'personas_test_audience',
  advertiser_id: '123',
  id_type: 'EMAIL_SHA256',
  action: 'create'
}

describe('TiktokAudiences.removeUser', () => {
  it('should fail if `personas_audience_key` field does not match the `custom_audience_name` field', async () => {
    await expect(
      testDestination.testAction('removeUser', {
        event,
        settings: {
          advertiser_id: '123'
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          personas_audience_key: 'mismatched_audience'
        }
      })
    ).rejects.toThrow('The value of `custom_audience_name` and `personas_audience_key` must match.')
  })

  it('should succeed if an exisiting audience is found', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/dmp/custom_audience/list/`)
      .get(/.*/)
      .query(urlParams)
      .reply(200, {
        code: 0,
        message: 'OK',
        data: { page_info: { total_number: 1 }, list: [{ name: 'personas_test_audience', audience_id: '1234345' }] }
      })
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`).post(/.*/, updateUsersRequestBody).reply(200)

    await expect(
      testDestination.testAction('removeUser', {
        event,
        settings: {
          advertiser_id: '123'
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          personas_audience_key: 'personas_test_audience',
          id_type: 'EMAIL_SHA256'
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should successfully create a new audience if one is not found', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/dmp/custom_audience/list/`)
      .get(/.*/)
      .query(urlParams)
      .reply(200, {
        code: 0,
        message: 'OK',
        data: { page_info: { total_number: 1 }, list: [{ name: 'another_audience', audience_id: '1234345' }] }
      })

    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/audience/`)
      .post(/.*/, createAudienceRequestBody)
      .reply(200, { data: { audience_id: '1234345' } })
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`).post(/.*/, updateUsersRequestBody).reply(200)

    await expect(
      testDestination.testAction('removeUser', {
        event,
        settings: {
          advertiser_id: '123'
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          personas_audience_key: 'personas_test_audience',
          id_type: 'EMAIL_SHA256'
        }
      })
    ).resolves.not.toThrowError()
  })
})
