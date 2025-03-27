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
      email: 'testing@testing.com',
      phone: '1234567890'
    }
  }
})

const updateUsersRequestBody = {
  advertiser_ids: ['123'],
  action: 'delete',
  id_schema: ['EMAIL_SHA256', 'PHONE_SHA256', 'IDFA_SHA256'],
  batch_data: [
    [
      {
        id: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777',
        audience_ids: ['1234345']
      },
      {
        id: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
        audience_ids: ['1234345']
      },
      {
        id: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        audience_ids: ['1234345']
      }
    ]
  ]
}

describe('TiktokAudiences.removeUser', () => {
  it('should succeed if audience id is valid', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`).post(/.*/, updateUsersRequestBody).reply(200)

    await expect(
      testDestination.testAction('removeUser', {
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

  it('should fail if audienceid is invalid', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`).post(/.*/, updateUsersRequestBody).reply(400)

    await expect(
      testDestination.testAction('removeUser', {
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
      testDestination.testAction('removeUser', {
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
          send_advertising_id: false,
          send_phone: false
        }
      })
    ).rejects.toThrow('At least one of `Send Email`, `Send Phone` or `Send Advertising ID` must be set to `true`.')
  })
})
