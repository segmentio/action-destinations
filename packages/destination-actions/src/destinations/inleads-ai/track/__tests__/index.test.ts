import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_KEY } from '../../__tests__/index.test'

const testDestination = createTestIntegration(Destination)

beforeAll(() => {
  nock.disableNetConnect()
})

afterAll(() => {
  nock.enableNetConnect()
  nock.cleanAll()
})

const inleadsData = {
  event_name: {
    '@path': '$.event'
  },
  properties: {
    '@path': '$.properties'
  },
  user_id: {
    '@path': '$.userId'
  },
  account_id: {
    '@path': '$.groupId'
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
    // Mock: Segment track Call
    nock("https://server.inleads.ai")
      .post('/events/track', {
        apiKey: API_KEY,
        eventName: "VISIT",
        email: "test@inleads.ai",
        name: "Tester",
        options: {},
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      properties: {
        recency: 'Now'
      },
      event: 'VISIT'
    })

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
