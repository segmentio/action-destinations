import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {
  apiKey: 'test_api'
}

const payload = {
  type: 'page',
  userId: 'x_id',
  anonymousId: 'anon_id',
  context : {
    page: {
      title: 'Test Page',
      url: 'https://example.com/test-page',
      referrer: 'https://example.com/referrer'
    }
  },
  properties: {
    email: 'test@test.com',
    list_id: 'list_id',
    prop1: 'value1',
    prop2: true,
    prop3: 123,
    prop4: ['value1', 'value2'],
    prop5: { nested: 'value' }
  },
  timestamp: '2023-10-01T00:00:00Z'
} as Partial<SegmentEvent>

const mapping = {
  event: { '@path': '$.event' },
  pageDetails: {
    title: { '@path': '$.context.page.title' },
    url: { '@path': '$.context.page.url' },
    referrer: { '@path': '$.context.page.referrer' }
  },
  identifiers: {
    userId: { '@path': '$.userId' },
    anonymousId: { '@path': '$.anonymousId' },
    email: { '@path': '$.properties.email' }
  },
  listId: { '@path': '$.properties.list_id' },
  properties: { '@path': '$.properties' },
  timestamp: { '@path': '$.timestamp' }
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})


describe('Yonoma', () => {
  describe('Send a trackPageEvent', () => {
    it('should send an trackPageEvent payload to Yonoma', async () => {
      const event = createTestEvent(payload)


      const json = {
        title: "Test Page",
        url: "https://example.com/test-page",
        referrer: "https://example.com/referrer",
        userId: "x_id",
        anonymousId: "anon_id",
        email: "test@test.com",
        listId: "list_id",
        properties: {
          prop1: "value1",
          prop2: true,
          prop3: 123,
          prop4: ["value1", "value2"],
          prop5: { nested: "value" }
        },
        timestamp: "2023-10-01T00:00:00Z"
      }
      nock('https://api.yonoma.io').post('/integration/segment/pageview', json).reply(200, {})

      const response = await testDestination.testAction('trackPageView', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
      
      expect(response.length).toBe(1)

    })
  })
})
