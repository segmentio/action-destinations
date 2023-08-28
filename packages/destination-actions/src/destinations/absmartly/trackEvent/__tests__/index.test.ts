import nock from 'nock'
import { createTestEvent, createTestIntegration, defaultValues, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import trackEvent from '../index'

const testDestination = createTestIntegration(Destination)

describe('ABsmartly.trackEvent', () => {
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

  const exposureEvent = createTestEvent({
    type: 'page',
    userId: '123',
    anonymousId: 'anon-123',
    properties: {
      exposure: {
        publishedAt: 123,
        units: [{ type: 'anonymousId', uid: 'anon-123' }],
        exposures: [
          {
            id: 10,
            name: 'test_experiment',
            assigned: true,
            exposedAt: 1602531200000
          }
        ],
        attributes: [
          {
            name: 'test',
            value: 'test',
            setAt: 1602530000000
          }
        ]
      }
    },
    event: 'Experiment Viewed',
    sentAt: '2023-01-01T00:00:00.100Z',
    originalTimestamp: '2023-01-01T00:00:00.000Z'
  } as SegmentEvent)

  it('should send the track event to ABsmartly collector as a goal', async () => {
    nock('https://test.absmartly.io/v1').put(`/context`).reply(200)

    const responses = await testDestination.testAction('trackEvent', {
      event: baseEvent,
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
          name: 'Order Completed',
          properties: baseEvent.properties
        }
      ]
    })
  })

  it('should send the track event to ABsmartly collector as a goal if exposure tracking is enabled and event name does not match', async () => {
    nock('https://test.absmartly.io/v1').put(`/context`).reply(200)

    const responses = await testDestination.testAction('trackEvent', {
      event: baseEvent,
      settings,
      mapping: { ...defaultValues(trackEvent.fields), exposuresTracking: true }
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
          name: 'Order Completed',
          properties: baseEvent.properties
        }
      ]
    })
  })

  it('should send the track event to ABsmartly collector as an exposure if exposure tracking is enabled and event name matches', async () => {
    nock('https://test.absmartly.io/v1').put(`/context`).reply(200)

    const responses = await testDestination.testAction('trackEvent', {
      event: exposureEvent,
      settings,
      mapping: { ...defaultValues(trackEvent.fields), exposuresTracking: true }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(await responses[0].request.json()).toStrictEqual({
      publishedAt: 1672531200100,
      units: [{ type: 'anonymousId', uid: 'anon-123' }],
      exposures: [
        {
          assigned: true,
          exposedAt: 1602531200000,
          id: 10,
          name: 'test_experiment'
        }
      ],
      attributes: [
        {
          name: 'test',
          value: 'test',
          setAt: 1602530000000
        }
      ]
    })
  })

  it('should do nothing when event name matches exposure but exposure tracking is disabled', async () => {
    nock('https://test.absmartly.io/v1').put(`/context`).reply(200)

    const responses = await testDestination.testAction('trackEvent', {
      event: exposureEvent,
      settings,
      mapping: { ...defaultValues(trackEvent.fields), exposuresTracking: false }
    })

    expect(responses.length).toBe(0)
  })
})
