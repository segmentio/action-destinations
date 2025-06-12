import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const ROADWAY_API_KEY = 'test-api-key'
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Roadwayai.trackPageView', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      type: 'page',
      timestamp,
      properties: {
        url: 'https://example.com/page',
        title: 'Test Page'
      },
      userId: 'user123'
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/page').reply(200, {})

    const responses = await testDestination.testAction('trackPageView', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        url: 'https://example.com/page',
        id: 'user123'
      })
    ])
  })

  it('should send request with correct headers', async () => {
    const event = createTestEvent({
      type: 'page',
      timestamp,
      properties: {
        url: 'https://example.com/page',
        title: 'Test Page'
      }
    })

    nock('https://app.roadwayai.com')
      .post('/api/v1/segment/events/page')
      .matchHeader('x-api-key', ROADWAY_API_KEY)
      .reply(200, {})

    const responses = await testDestination.testAction('trackPageView', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchObject({
      'x-api-key': ROADWAY_API_KEY
    })
  })

  it('should handle custom mapping', async () => {
    const event = createTestEvent({
      type: 'page',
      timestamp,
      properties: {
        url: 'https://custom.com/page',
        title: 'Custom Page'
      },
      userId: 'customuser'
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/page').reply(200, {})

    const responses = await testDestination.testAction('trackPageView', {
      event,
      mapping: {
        url: {
          '@path': '$.properties.url'
        },
        id: {
          '@path': '$.userId'
        },
        data: {
          '@path': '$.properties'
        }
      },
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        url: 'https://custom.com/page',
        id: 'customuser'
      })
    ])
  })

  it('should handle events with anonymous_id', async () => {
    const event = createTestEvent({
      type: 'page',
      timestamp,
      properties: {
        url: 'https://example.com/page',
        title: 'Test Page'
      },
      anonymousId: 'anon123'
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/page').reply(200, {})

    const responses = await testDestination.testAction('trackPageView', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        url: 'https://example.com/page',
        anonymous_id: 'anon123'
      })
    ])
  })

  it('should handle events with referrer', async () => {
    const event = createTestEvent({
      type: 'page',
      timestamp,
      properties: {
        url: 'https://example.com/page',
        referrer: 'https://google.com',
        title: 'Test Page'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/page').reply(200, {})

    const responses = await testDestination.testAction('trackPageView', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        url: 'https://example.com/page',
        referrer: 'https://google.com'
      })
    ])
  })

  it('should require url field', async () => {
    const event = createTestEvent({
      type: 'page',
      timestamp,
      properties: {
        title: 'Test Page'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/page').reply(200, {})

    try {
      await testDestination.testAction('trackPageView', {
        event,
        useDefaultMappings: true,
        settings: {
          apiKey: ROADWAY_API_KEY
        }
      })
    } catch (e) {
      expect(e.message).toBe("The root value is missing the required field 'url'.")
    }
  })

  it('should invoke performBatch for batches', async () => {
    const events = [
      createTestEvent({
        type: 'page',
        timestamp,
        properties: {
          url: 'https://example.com/page1',
          title: 'Page 1'
        },
        userId: 'user1'
      }),
      createTestEvent({
        type: 'page',
        timestamp,
        properties: {
          url: 'https://example.com/page2',
          title: 'Page 2'
        },
        userId: 'user2'
      })
    ]

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/page').reply(200, {})

    const responses = await testDestination.testBatchAction('trackPageView', {
      events,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        url: 'https://example.com/page1',
        id: 'user1'
      }),
      expect.objectContaining({
        url: 'https://example.com/page2',
        id: 'user2'
      })
    ])
  })
})
