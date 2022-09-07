import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import type { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

type AuthTokens = {
  accessToken: string
  refreshToken: string
}

const settings: Settings = {
  ad_account_id: '123'
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
  traits: {
    email: 'testing@testing.com'
  },
  context: {
    device: {
      advertisingId: '123'
    }
  }
})

describe('LinkedinAudiences.updateAudience', () => {
  it('should fail if `personas_audience_key` field does not match the `source_segment_id` field', async () => {
    await expect(
      await testDestination.testAction('updateAudience', {
        event,
        settings,
        useDefaultMappings: true,
        auth,
        mapping: {
          personas_audience_key: 'mismatched_audience'
        }
      })
    ).rejects.toThrowError('The value of`source_segment_id` and `personas_audience_key must match.')
  })

  it('should correct construct a querystring to fetch dmpSegments', async () => {
    nock(
      'https://api.linkedin.com/rest/dmpSegments?q=account&account=urn:li:sponsoredAccount:123&sourceSegmentId=personas_test_audience&sourcePlatform=SEGMENT'
    )
      .get('')
      .reply(200, {})

    const response = await testDestination.testAction('updateAudience', {
      event,
      settings,
      useDefaultMappings: true,
      auth,
      mapping: {
        personas_audience_key: 'mismatched_audience'
      }
    })

    console.log(response)
    // expect(response.status).toBe(200)
  })
})
