import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const email = 'test@test.com'
const companyName = 'test_company'
const apiKey = 'test_api_key'
const segmentRegion = 'US'
const segmentWriteKey = 'test_segment_write_key'

describe('Ambee.subscribeUserToCampaign', () => {
  it('should work', async () => {
    nock('https://segment-api.ambeedata.com').post('/v1/campaign-info').reply(200, {})

    const event = createTestEvent({
      userId: 'user123',
      context: {
        library: {
          name: 'analytics.js',
          version: '123'
        },
        device: {
          type: 'device'
        },
        ip: '1.1.1.1'
      },
      properties: {
        campaignId: 'test_campaign_id',
        airQualitySubscription: 'hazardous',
        pollenSubscription: 'very_high'
      }
    })

    const responses = await testDestination.testAction('subscribeUserToCampaign', {
      event,
      settings: {
        email,
        companyName,
        apiKey,
        segmentRegion,
        segmentWriteKey
      },
      mapping: {
        campaignId: {
          '@path': '$.properties.campaignId'
        },
        airQualitySubscription: {
          '@path': '$.properties.hazardous'
        },
        pollenSubscription: {
          '@path': '$.properties.very_high'
        }
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
  })
})
