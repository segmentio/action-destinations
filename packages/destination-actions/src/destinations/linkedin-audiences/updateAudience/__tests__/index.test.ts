import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL, LINKEDIN_SOURCE_PLATFORM } from '../../constants'

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

const urlParams = {
  q: 'account',
  account: 'urn:li:sponsoredAccount:123',
  sourceSegmentId: 'personas_test_audience',
  sourcePlatform: LINKEDIN_SOURCE_PLATFORM
}

const updateUsersRequestBody = {
  elements: [
    {
      action: 'ADD',
      userIds: [
        {
          idType: 'SHA256_EMAIL',
          idValue: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
        },
        {
          idType: 'GOOGLE_AID',
          idValue: '123'
        }
      ]
    }
  ]
}

const createDmpSegmentRequestBody = {
  name: 'personas_test_audience',
  sourcePlatform: LINKEDIN_SOURCE_PLATFORM,
  sourceSegmentId: 'personas_test_audience',
  account: `urn:li:sponsoredAccount:456`,
  accessPolicy: 'PRIVATE',
  type: 'USER',
  destinations: [
    {
      destination: 'LINKEDIN'
    }
  ]
}

describe('LinkedinAudiences.updateAudience', () => {
  it('should fail if `personas_audience_key` field does not match the `source_segment_id` field', async () => {
    await expect(
      testDestination.testAction('updateAudience', {
        event,
        settings: {
          ad_account_id: '123',
          send_email: true,
          send_google_advertising_id: true
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          personas_audience_key: 'mismatched_audience'
        }
      })
    ).rejects.toThrow('The value of `source_segment_id` and `personas_audience_key` must match.')
  })

  it('should fail if both `send_email` and `send_google_advertising_id` settings are set to false', async () => {
    await expect(
      testDestination.testAction('updateAudience', {
        event,
        settings: {
          ad_account_id: '123',
          send_email: false,
          send_google_advertising_id: false
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          personas_audience_key: 'personas_test_audience'
        }
      })
    ).rejects.toThrow('At least one of `Send Email` or `Send Google Advertising ID` must be set to `true`.')
  })

  it('should succeed if an exisitng DMP Segment is found', async () => {
    nock(`${BASE_URL}/dmpSegments`)
      .get(/.*/)
      .query(urlParams)
      .reply(200, { elements: [{ id: 'dmp_segment_id' }] })
    nock(`${BASE_URL}/dmpSegments/dmp_segment_id/users`).post(/.*/, updateUsersRequestBody).reply(200)

    await expect(
      testDestination.testAction('updateAudience', {
        event,
        settings: {
          ad_account_id: '123',
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
      testDestination.testAction('updateAudience', {
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
