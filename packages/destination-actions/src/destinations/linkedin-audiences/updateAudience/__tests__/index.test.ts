import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

type AuthTokens = {
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
    }
  }
})

const urlParams = {
  q: 'account',
  account: 'urn:li:sponsoredAccount:123',
  sourceSegmentId: 'personas_test_audience',
  sourcePlatform: 'SEGMENT'
}

const updateUsersRequestBody = {
  elements: [
    {
      action: 'ADD',
      userIds: [
        // {
        //   idType: 'SHA256_EMAIL',
        //   idValue: '2cbc46cfe86407789f9430ae7bec0ffea8fa4f064bcd600df01d5207a75f0a6a'
        // },
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
  sourcePlatform: 'SEGMENT',
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
          ad_account_id: '123'
        },
        useDefaultMappings: true,
        auth,
        mapping: {
          personas_audience_key: 'mismatched_audience'
        }
      })
    ).rejects.toThrow('The value of `source_segment_id` and `personas_audience_key` must match.')
  })

  it('should succeed if an exisitng DMP Segment is found', async () => {
    nock(`https://api.linkedin.com/rest/dmpSegments`)
      .get(/.*/)
      .query(urlParams)
      .reply(200, { elements: [{ id: 'dmp_segment_id' }] })
    nock('https://api.linkedin.com/rest/dmpSegments/dmp_segment_id/users').post(/.*/, updateUsersRequestBody).reply(200)

    await expect(
      testDestination.testAction('updateAudience', {
        event,
        settings: {
          ad_account_id: '123'
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

    nock(`https://api.linkedin.com/rest/dmpSegments`).get(/.*/).query(urlParams).reply(200, { elements: [] })
    nock(`https://api.linkedin.com/rest/dmpSegments`)
      .get(/.*/)
      .query(urlParams)
      .reply(200, { elements: [{ id: 'dmp_segment_id' }] })
    nock('https://api.linkedin.com/rest/dmpSegments').post(/.*/, createDmpSegmentRequestBody).reply(200)
    nock('https://api.linkedin.com/rest/dmpSegments/dmp_segment_id/users').post(/.*/, updateUsersRequestBody).reply(200)

    await expect(
      testDestination.testAction('updateAudience', {
        event,
        settings: {
          ad_account_id: '456'
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
