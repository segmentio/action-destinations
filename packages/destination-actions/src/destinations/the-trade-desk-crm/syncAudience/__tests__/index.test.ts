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

describe('TheTradeDeskCrm.syncAudience', () => {
  it('should succeed if an exisitng CRM Segment is found', async () => {
    // nock get CRMs
    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id`)
      .get(/.*/)
      .reply(200, { Segments: [{ SegmentName: 'test_audience', CrmDataId: '123' }] })

    nock(`https://api.thetradedesk.com/v3/crmdata/segment/advertiser_id/123`)
      .post(/.*/, { PiiType: 'Email', MergeMode: 'Replace' })
      .reply(200, { Url: 'https://api.thetradedesk.com/drop' })

    nock(`https://api.thetradedesk.com/drop`).put(/.*/).reply(200)

    await expect(
      testDestination.testAction('syncAudience', {
        event,
        settings: {
          advertiser_id: 'advertiser_id',
          auth_token: 'test_token'
        },
        useDefaultMappings: true,
        mapping: {
          name: 'test_audience',
          region: 'US',
          pii_type: 'Email'
        }
      })
    ).resolves.not.toThrowError()
  })
})
