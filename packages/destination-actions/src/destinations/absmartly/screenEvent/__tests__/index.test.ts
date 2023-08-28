import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('ABsmartly.screenEvent', () => {
  const settings = {
    collectorEndpoint: 'https://test.absmartly.io/v1',
    environment: 'dev',
    apiKey: 'testkey'
  }

  const screenEvent = createTestEvent({
    type: 'screen',
    userId: '123',
    anonymousId: 'anon-123',
    properties: {
      url: 'https://example.com'
    },
    name: 'Login',
    sentAt: '2023-01-01T00:00:00.100Z',
    originalTimestamp: '2023-01-01T00:00:00.000Z'
  } as SegmentEvent)

  it('should send the screen event to ABsmartly collector as a goal', async () => {
    nock('https://test.absmartly.io/v1').put(`/context`).reply(200)

    const responses = await testDestination.testAction('screenEvent', {
      event: screenEvent,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(await responses[0].request.json()).toStrictEqual({
      publishedAt: 1672531200100,
      units: [
        { type: 'anonymousId', uid: 'anon-123' },
        { type: 'userId', uid: '123' }
      ],
      goals: [
        {
          achievedAt: 1672531200000,
          name: 'Screen: Login',
          properties: screenEvent.properties
        }
      ]
    })
  })
})
