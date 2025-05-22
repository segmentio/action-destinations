import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Roadwayai.trackEvent', () => {
  it('should send track event to RoadwayAI API', async () => {
    nock('https://app.roadwayai.com').post('/api/v1/segment/events/track').reply(200, { success: true })

    const event = createTestEvent({
      event: 'Test Event',
      properties: {
        property1: 'value1',
        property2: 'value2'
      }
    })

    const mapping = {
      event: {
        '@path': '$.event'
      },
      timestamp: {
        '@path': '$.timestamp'
      },
      properties: {
        '@path': '$.properties'
      }
    }

    const settings = {
      apiKey: 'test-api-key'
    }

    const responses = await testDestination.testAction('trackEvent', {
      event,
      mapping,
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toEqual([
      {
        event: 'Test Event',
        properties: {
          property1: 'value1',
          property2: 'value2'
        }
      }
    ])
    expect(responses[0].options.headers).toEqual({
      'x-api-key': 'test-api-key'
    })
  })

  it('should handle batch events', async () => {
    nock('https://app.roadwayai.com').post('/api/v1/segment/events/track').reply(200, { success: true })

    const events = [
      createTestEvent({
        event: 'Event 1',
        properties: { key1: 'value1' }
      }),
      createTestEvent({
        event: 'Event 2',
        properties: { key2: 'value2' }
      })
    ]

    const settings = {
      apiKey: 'test-api-key'
    }

    const mapping = {
      event: {
        '@path': '$.event'
      },
      properties: {
        '@path': '$.properties'
      }
    }

    const responses = await testDestination.testBatchAction('trackEvent', {
      events,
      mapping,
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toContainEqual(
      expect.objectContaining({
        event: 'Event 1'
      })
    )
    expect(responses[0].options.json).toContainEqual(
      expect.objectContaining({
        event: 'Event 2'
      })
    )
  })
})
