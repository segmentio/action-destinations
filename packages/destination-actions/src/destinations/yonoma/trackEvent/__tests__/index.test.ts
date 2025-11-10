import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {
  apiKey: 'test_api'
}

const payload = {
  event: 'Test Event',
  type: 'track',
  userId: 'x_id',
  anonymousId: 'anon_id',
  properties: {
    email: 'test@test.com',
    list_id: 'list_id',
    prop1: 'value1',
    prop2: true,
    prop3: 123,
    prop4: ['value1', 'value2'],
    prop5: { nested: 'value' }
  },
  timestamp: '2023-10-01T00:00:00Z',
  context: {
    ip: '127.0.0.1',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
    page: {
      url: 'https://example.com/page',
      title: 'Example Page',
      referrer: 'https://google.com',
      path: '/page',
      search: '?query=1'
    },
    campaign: {
      name: 'Summer Sale',
      source: 'Newsletter',
      medium: 'Email',
      term: 'summer',
      content: 'toplink'
    },
    location: {
      country: 'USA',
      region: 'California',
      city: 'San Francisco'
    }
  }
} as Partial<SegmentEvent>

const mapping = {
  event: { '@path': '$.event' },
  identifiers: {
    userId: { '@path': '$.userId' },
    anonymousId: { '@path': '$.anonymousId' },
    email: { '@path': '$.properties.email' }
  },
  listId: { '@path': '$.properties.list_id' },
  timestamp: { '@path': '$.timestamp' },
  ip: { '@path': '$.context.ip' },
  userAgent: { '@path': '$.context.userAgent' },
  page: {
    title: { '@path': '$.context.page.title' },
    url: { '@path': '$.context.page.url' },
    referrer: { '@path': '$.context.page.referrer' },
    path: { '@path': '$.context.page.path' },
    search: { '@path': '$.context.page.search' }
  },
  campaign: {
    name: { '@path': '$.context.campaign.name' },
    source: { '@path': '$.context.campaign.source' },
    medium: { '@path': '$.context.campaign.medium' },
    term: { '@path': '$.context.campaign.term' },
    content: { '@path': '$.context.campaign.content' }
  },
  location: {
    country: { '@path': '$.context.location.country' },
    region: { '@path': '$.context.location.region' },
    city: { '@path': '$.context.location.city' }
  },
  properties: { '@path': '$.properties' }
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Yonoma', () => {
  describe('Send a sendEvent', () => {
    it('should send an sendEvent payload to Yonoma', async () => {
      const event = createTestEvent(payload)

      const json = {
        event: 'Test Event',
        userId: 'x_id',
        anonymousId: 'anon_id',
        email: 'test@test.com',
        listId: 'list_id',
        timestamp: '2023-10-01T00:00:00Z',
        ip: '127.0.0.1',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
        page: {
          url: 'https://example.com/page',
          title: 'Example Page',
          referrer: 'https://google.com',
          path: '/page',
          search: '?query=1'
        },
        campaign: {
          name: 'Summer Sale',
          source: 'Newsletter',
          medium: 'Email',
          term: 'summer',
          content: 'toplink'
        },
        location: {
          country: 'USA',
          region: 'California',
          city: 'San Francisco'
        },
        properties: {
          prop1: 'value1',
          prop2: true,
          prop3: 123,
          prop4: ['value1', 'value2'],
          prop5: { nested: 'value' }
        }
      }
      nock('https://api.yonoma.io').post('/integration/segment/trackevent', json).reply(200, {})

      const response = await testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(response.length).toBe(1)
    })
  })
})
