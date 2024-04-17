import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_KEY } from '../../__tests__/index.test'

const testDestination = createTestIntegration(Destination)

afterAll(() => {
  nock.cleanAll()
})

const inleadsData = {
  eventName: {
    '@path': '$.event'
  },
  user_id: {
    '@path': '$.userId'
  },
  utc_time: {
    '@path': '$.timestamp'
  }
}

describe('InleadsAI.track', () => {
  test('Should throw an error if `event_name` is not defined', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {
        recency: 'Now'
      },
      event: 'INIT'
    })

    await expect(
      testDestination.testAction('track', {
        event,
        mapping: inleadsData
      })
    ).rejects.toThrowError()
  })

  test('Should throw an error if apiKey is not defined', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {
        recency: 'Now'
      },
      event: 'VISIT'
    })

    await expect(
      testDestination.testAction('track', {
        event,
        mapping: inleadsData,
        settings: {
          apiKey: API_KEY
        }
      })
    ).rejects.toThrowError()
  })

  test('Should send an track event to InleadsAI', async () => {

    const event = createTestEvent({
      type: 'track',
      properties: {
        recency: 'Now'
      },
      event: 'VISIT'
    })
    // Mock: Segment track Call
    nock("https://server.inleads.ai")
      .post('/events/track', {
        apiKey: API_KEY,
        eventName: event.event,
        user_id: event.userId,
        utc_time: event.timestamp?.toString(),
      }, {
        reqheaders: {
          Authorization: `Basic ${API_KEY}`
        }
      })
      .reply(200, { success: true })

    const responses = await testDestination.testAction('track', {
      event,
      mapping: inleadsData,
      settings: {
        apiKey: API_KEY
      }
    })

    expect(responses[0].status).toEqual(200)
  })
})
