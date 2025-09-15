import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import { API_URL } from '../../config'

const testDestination = createTestIntegration(Destination)

describe('MantleRevOps.pushEvent', () => {
  it('should push usage event to mantle', async () => {
    nock(API_URL).post('/usage_events').reply(200, {})

    const event = createTestEvent({
      type: 'track',
      userId: 'test-user-id',
      event: 'test-event',
      timestamp: '2022-03-07T17:02:44.000Z',
      properties: {
        test: 'test',
        customerId: 'test-customer-id',
        eventId: 'test-event-id'
      }
    })
    const responses = await testDestination.testAction('pushEvent', {
      event,
      settings: {
        appId: 'fake-app-id',
        apiKey: 'fake-api-key'
      },
      mapping: {
        eventName: {
          '@path': '$.event'
        },
        eventId: {
          '@path': '$.properties.eventId'
        },
        customerId: {
          '@path': '$.properties.customerId'
        },
        properties: {
          '@path': '$.properties'
        },
        timestamp: {
          '@path': '$.timestamp'
        },
        useDefaultMappings: true
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      event_name: 'test-event',
      customerId: 'test-customer-id',
      properties: {
        test: 'test',
        customerId: 'test-customer-id',
        eventId: 'test-event-id'
      },
      timestamp: '2022-03-07T17:02:44.000Z'
    })
  })
})
