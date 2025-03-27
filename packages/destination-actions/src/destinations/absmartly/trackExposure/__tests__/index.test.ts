import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { unixTimestampOf } from '../../timestamp'
import { PublishRequestEvent } from '../../event'

const testDestination = createTestIntegration(Destination)

describe('ABsmartly.trackExposure', () => {
  const settings = {
    collectorEndpoint: 'https://test.absmartly.io/v1',
    environment: 'dev',
    apiKey: 'testkey'
  }

  const exposureEvent = createTestEvent({
    type: 'page',
    userId: '123',
    anonymousId: 'anon-123',
    properties: {
      exposure: {
        publishedAt: 1602531300000,
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

  it('should send the event to ABsmartly collector as an exposure', async () => {
    nock('https://test.absmartly.io/v1').put(`/context`).reply(200)

    const responses = await testDestination.testAction('trackExposure', {
      event: exposureEvent,
      settings,
      useDefaultMappings: true
    })

    const timestamp = unixTimestampOf(exposureEvent.timestamp!)
    const exposureRequest = exposureEvent.properties.exposure as PublishRequestEvent

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(await responses[0].request.json()).toStrictEqual({
      historic: true,
      publishedAt: timestamp,
      units: [{ type: 'anonymousId', uid: 'anon-123' }],
      exposures: [
        {
          assigned: true,
          exposedAt: timestamp - (exposureRequest.publishedAt - exposureRequest.exposures?.[0].exposedAt),
          id: 10,
          name: 'test_experiment'
        }
      ],
      attributes: [
        {
          name: 'test',
          value: 'test',
          setAt: timestamp - (exposureRequest.publishedAt - exposureRequest.attributes?.[0].setAt)
        }
      ]
    })
  })
})
