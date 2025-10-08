import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

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
      mobileDeviceIds: 'test-id'
    }
  }
})

describe('First-Party-dv360.addToAudMobileDeviceId', () => {
  it('should use v4 endpoint when CANARY VERSION', async () => {
    nock('https://displayvideo.googleapis.com/v4/firstPartyAndPartnerAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { firstPartyAndPartnerAudienceId: '1234567890' })

    const responses = await testDestination.testAction('addToAudMobileDeviceId', {
      event,
      mapping: {
        mobileDeviceIds: ['test-id'],
        external_id: '1234567890',
        advertiser_id: '1234567890',
        enable_batching: false,
        batch_size: 1
      },
      features: { 'first-party-dv360-canary-version': true }
    })

    expect(JSON.parse(responses[0].options.body as string)).toMatchInlineSnapshot(`
      Object {
        "addedMobileDeviceIdList": Object {
          "consent": Object {
            "adPersonalization": "CONSENT_STATUS_GRANTED",
            "adUserData": "CONSENT_STATUS_GRANTED",
          },
          "mobileDeviceIds": Array [
            "test-id",
          ],
        },
        "advertiserId": "1234567890",
      }
    `)
  })

  it('should addToAudMobileDeviceId', async () => {
    nock('https://displayvideo.googleapis.com/v4/firstPartyAndPartnerAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { firstPartyAndPartnerAudienceId: '1234567890' })

    const responses = await testDestination.testAction('addToAudMobileDeviceId', {
      event,
      mapping: {
        mobileDeviceIds: ['test-id'],
        external_id: '1234567890',
        advertiser_id: '1234567890',
        enable_batching: false,
        batch_size: 1
      }
    })

    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"advertiserId\\":\\"1234567890\\",\\"addedMobileDeviceIdList\\":{\\"mobileDeviceIds\\":[\\"test-id\\"],\\"consent\\":{\\"adUserData\\":\\"CONSENT_STATUS_GRANTED\\",\\"adPersonalization\\":\\"CONSENT_STATUS_GRANTED\\"}}}"`
    )
  })

  it('should batch multiple payloads into a single request when enable_batching is true', async () => {
    nock('https://displayvideo.googleapis.com/v4/firstPartyAndPartnerAudiences')
      .post('/1234567890:editCustomerMatchMembers')
      .reply(200, { firstPartyAndPartnerAudienceId: '1234567890' })

    const events = createBatchTestEvents(createContactList)
    const responses = await testDestination.testBatchAction('addToAudMobileDeviceId', {
      events: events,
      mapping: {
        mobileDeviceIds: ['test-id'],
        external_id: '1234567890',
        advertiser_id: '1234567890',
        enable_batching: true,
        batch_size: 10
      }
    })

    const requestBody = JSON.parse(String(responses[0].options.body))
    expect(requestBody.addedMobileDeviceIdList.mobileDeviceIds.length).toBe(2)
    expect(requestBody.addedMobileDeviceIdList.mobileDeviceIds[0]).toBeDefined()
    expect(requestBody.addedMobileDeviceIdList.mobileDeviceIds[1]).toBeDefined()
  })
})

export type BatchContactListItem = {
  mobileDeviceIds: string
}

export const createBatchTestEvents = (batchContactList: BatchContactListItem[]) =>
  batchContactList.map((contact) =>
    createTestEvent({
      type: 'identify',
      traits: {
        mobileDeviceIds: contact.mobileDeviceIds
      }
    })
  )

const createContactList: BatchContactListItem[] = [
  {
    mobileDeviceIds: 'test-id'
  },
  {
    mobileDeviceIds: 'test-id2'
  }
]
