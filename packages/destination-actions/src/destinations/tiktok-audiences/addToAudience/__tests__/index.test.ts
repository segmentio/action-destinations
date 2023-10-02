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
  event: 'Audience Entered',
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
  action: 'add',
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

describe('TiktokAudiences.addToAudience', () => {
  it('should succeed if audience id is valid', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}`).post('/segment/mapping/', updateUsersRequestBody).reply(200)

    const r = await testDestination.testAction('addToAudience', {
      auth,
      event,
      settings: {},
      useDefaultMappings: true,
      mapping: {
        send_advertising_id: true
      }
    })

    expect(r[0].status).toEqual(200)
  })

  it('should normalize and hash emails correctly', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}`)
      .post('/segment/mapping/', {
        advertiser_ids: ['123'],
        action: 'add',
        id_schema: ['EMAIL_SHA256'],
        batch_data: [
          [
            {
              id: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777',
              audience_ids: [EXTERNAL_AUDIENCE_ID]
            }
          ]
        ]
      })
      .reply(200)

    const responses = await testDestination.testAction('addToAudience', {
      event,
      settings: {
        advertiser_ids: ['123']
      },
      useDefaultMappings: true,
      auth,
      mapping: {
        send_advertising_id: false
      }
    })

    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"advertiser_ids\\":[\\"123\\"],\\"action\\":\\"add\\",\\"id_schema\\":[\\"EMAIL_SHA256\\"],\\"batch_data\\":[[{\\"id\\":\\"584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777\\",\\"audience_ids\\":[\\"12345\\"]}]]}"`
    )
  })

  it('should fail if an audience id is invalid', async () => {
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

    const r = await testDestination.testAction('addToAudience', {
      event: anotherEvent,
      settings: {
        advertiser_ids: ['123']
      },
      useDefaultMappings: true,
      auth,
      mapping: {}
    })

    expect(r[0].status).toEqual(400)
  })

  it('should fail if all the send fields are false', async () => {
    nock(`${BASE_URL}${TIKTOK_API_VERSION}/segment/mapping/`).post(/.*/, updateUsersRequestBody).reply(200)

    await expect(
      testDestination.testAction('addToAudience', {
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
      testDestination.testAction('addToAudience', {
        event,
        settings: {
          advertiser_ids: ['123']
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          send_email: true,
          send_advertising_id: true
        }
      })
    ).rejects.toThrowError('At least one of Email Id or Advertising ID must be provided.')
  })
})
