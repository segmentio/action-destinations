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

const EXTERNAL_AUDIENCE_ID = '12345'
const ADVERTISER_ID = '123' // References audienceSettings.advertiserId
const ADVERTISING_ID = '4242' // References device.advertisingId
const ID_TYPE = 'EMAIL_SHA256' // References audienceSettings.idType

const event = createTestEvent({
  event: 'Audience Exited',
  type: 'track',
  properties: {},
  context: {
    device: {
      advertisingId: ADVERTISING_ID
    },
    traits: {
      email: 'testing@testing.com'
    },
    personas: {
      audience_settings: {
        advertiserId: ADVERTISER_ID,
        idType: ID_TYPE
      },
      external_audience_id: EXTERNAL_AUDIENCE_ID
    }
  }
})

const updateUsersRequestBody = {
  id_schema: ['EMAIL_SHA256', 'IDFA_SHA256'],
  advertiser_ids: [ADVERTISER_ID],
  action: 'delete',
  batch_data: [
    [
      {
        id: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777',
        audience_ids: [EXTERNAL_AUDIENCE_ID]
      },
      {
        id: '0315b4020af3eccab7706679580ac87a710d82970733b8719e70af9b57e7b9e6',
        audience_ids: [EXTERNAL_AUDIENCE_ID]
      }
    ]
  ]
}

describe('TiktokAudiences.removeFromAudience', () => {
  it('should succeed if audience id is valid', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`).post(/.*/, updateUsersRequestBody).reply(200)

    await expect(
      testDestination.testAction('removeFromAudience', {
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
    const anotherEvent = createTestEvent({
      event: 'Audience Entered',
      type: 'track',
      properties: {
        audience_key: 'personas_test_audience'
      },
      context: {
        device: {
          advertisingId: ADVERTISING_ID
        },
        traits: {
          email: 'testing@testing.com'
        },
        personas: {
          audience_settings: {
            advertiserId: ADVERTISER_ID,
            idType: ID_TYPE
          },
          external_audience_id: 'THIS_ISNT_REAL'
        }
      }
    })

    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`)
      .post(/.*/, {
        id_schema: ['EMAIL_SHA256', 'IDFA_SHA256'],
        advertiser_ids: [ADVERTISER_ID],
        action: 'add',
        batch_data: [
          [
            {
              id: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777',
              audience_ids: ['THIS_ISNT_REAL']
            },
            {
              id: '0315b4020af3eccab7706679580ac87a710d82970733b8719e70af9b57e7b9e6',
              audience_ids: ['THIS_ISNT_REAL']
            }
          ]
        ]
      })
      .reply(400)

    await expect(
      testDestination.testAction('removeFromAudience', {
        event: anotherEvent,
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
      testDestination.testAction('removeFromAudience', {
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
})
