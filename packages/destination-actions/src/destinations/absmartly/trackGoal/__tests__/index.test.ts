import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { unixTimestampOf } from '../../timestamp'

const testDestination = createTestIntegration(Destination)

describe('ABsmartly.trackGoal', () => {
  const settings = {
    collectorEndpoint: 'https://test.absmartly.io/v1',
    environment: 'dev',
    apiKey: 'testkey'
  }

  const baseEvent = createTestEvent({
    type: 'page',
    event: 'Order Completed',
    userId: '123',
    anonymousId: 'anon-123',
    properties: {
      url: 'https://example.com'
    },
    sentAt: '2023-01-01T00:00:00.100Z',
    originalTimestamp: '2023-01-01T00:00:00.000Z'
  } as SegmentEvent)

  it('should send the track event to ABsmartly collector as a goal', async () => {
    nock('https://test.absmartly.io/v1').put(`/context`).reply(200)

    const responses = await testDestination.testAction('trackGoal', {
      event: baseEvent,
      settings,
      useDefaultMappings: true
    })

    const timestamp = unixTimestampOf(baseEvent.timestamp!)

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(await responses[0].request.json()).toStrictEqual({
      historic: true,
      publishedAt: timestamp,
      units: [
        { type: 'anonymousId', uid: 'anon-123' },
        { type: 'userId', uid: '123' }
      ],
      goals: [
        {
          achievedAt: timestamp,
          name: 'Order Completed',
          properties: baseEvent.properties
        }
      ]
    })
  })
})
