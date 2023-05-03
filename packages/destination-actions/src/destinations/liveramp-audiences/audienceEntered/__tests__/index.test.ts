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
      email: 'testing@testing.com'
    }
  }
})

describe('LiverampAudiences.audienceEntered', () => {
  it('should successfully create a new DMP Segment if an existing Segment is not found', async () => {
    urlParams.account = 'urn:li:sponsoredAccount:456'

    nock(`${BASE_URL}/dmpSegments`).get(/.*/).query(urlParams).reply(200, { elements: [] })
    nock(`${BASE_URL}/dmpSegments`)
      .get(/.*/)
      .query(urlParams)
      .reply(200, { elements: [{ id: 'dmp_segment_id' }] })
    nock(`${BASE_URL}/dmpSegments`).post(/.*/, createDmpSegmentRequestBody).reply(200)
    nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/, updateUsersRequestBody).reply(200)

    await expect(
      testDestination.testAction('audienceEntered', {
        event,
        settings: {
          ad_account_id: '456',
          send_email: true,
          send_google_advertising_id: true
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          personas_audience_key: 'personas_test_audience'
        }
      })
    ).resolves.not.toThrowError()
  })
})
