import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const actionSlug = 'track'

const settings: Settings = {
  apiToken: 'test'
}

const event = createTestEvent({
  type: 'track',
  event: 'Test Event',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    product_id: 'pid_1'
  },
  context: {
    page: {
      search: 'search_query'
    },
    ip: '111.222.333.444',
    campaign: {
      name: 'campaign_name',
      term: 'campaign_term',
      source: 'campaign_source',
      medium: 'campaign_medium',
      content: 'campaign_content'
    }
  }
})

describe('Apolloio.track', () => {
  it('should send event to Apollo.io', async () => {
    nock('https://apollo.io/').post(/.*/).reply(200)

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Test Event',
        properties: { product_id: 'pid_1' },
        timestamp: '2022-03-30T17:24:58Z',
        ipAddress: '111.222.333.444',
        userId: 'user1234',
        campaign: {
          name: 'campaign_name',
          term: 'campaign_term',
          source: 'campaign_source',
          medium: 'campaign_medium',
          content: 'campaign_content'
        },
        page: {
          search: 'search_query'
        }
      }
    ])
  })
})
