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
  event: 'Audience Entered',
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

const updateUsersRequestBody = {
  advertiser_ids: ['123'],
  action: 'add',
  id_schema: ['EMAIL_SHA256', 'IDFA_SHA256'],
  batch_data: [
    [
      {
        id: '44d206f60172cd898051a9fb2174750aee1eca00f6f63f12801b90644321e342',
        audience_ids: ['1234345']
      },
      {
        id: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        audience_ids: ['1234345']
      }
    ]
  ]
}

describe('TiktokAudiences.addUser', () => {
  it('should succeed if audience id is valid', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`).post(/.*/, updateUsersRequestBody).reply(200)
    await expect(
      testDestination.testAction('addUser', {
        event,
        settings: {
          advertiser_ids: ['123']
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          selected_advertiser_id: '123',
          audience_id: '1234345'
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should fail if an audience id is invalid', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`).post(/.*/, updateUsersRequestBody).reply(400)

    await expect(
      testDestination.testAction('addUser', {
        event,
        settings: {
          advertiser_ids: ['123']
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          selected_advertiser_id: '123',
          audience_id: 'personas_test_audience'
        }
      })
    ).rejects.toThrowError()
  })

  it('should fail if all the send fields are false', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`).post(/.*/, updateUsersRequestBody).reply(200)

    await expect(
      testDestination.testAction('addUser', {
        event,
        settings: {
          advertiser_ids: ['123']
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          selected_advertiser_id: '123',
          audience_id: '123456',
          send_email: false,
          send_advertising_id: false
        }
      })
    ).rejects.toThrow('At least one of `Send Email`, or `Send Advertising ID` must be set to `true`.')
  })
  it('should fail if email and/or advertising_id is not in the payload', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`).post(/.*/, updateUsersRequestBody).reply(400)

    delete event?.context?.device
    delete event?.context?.traits

    await expect(
      testDestination.testAction('addUser', {
        event,
        settings: {
          advertiser_ids: ['123']
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          selected_advertiser_id: '123',
          audience_id: 'personas_test_audience',
          send_email: true,
          send_advertising_id: true
        }
      })
    ).rejects.toThrowError('At least one of Email Id or Advertising ID must be provided.')
  })
})
