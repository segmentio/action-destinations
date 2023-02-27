import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const actionSlug = 'trackEvent'
const testSettings: Settings = {
  client_id: '123123123'
}

describe('LaunchDarkly.trackEvent', () => {
  it('should send custom events to LaunchDarkly with default mapping', async () => {
    nock('https://events.launchdarkly.com').post(`/events/bulk/${testSettings.client_id}`).reply(202)

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user1234',
      anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      properties: {
        revenue: 123.456
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: testSettings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
    expect(responses[0].options.json).toMatchObject([
      {
        key: 'Test Event',
        contextKeys: { user: 'user1234', unauthenticatedUser: '72d7bed1-4f42-4f2f-8955-72677340546b' },
        kind: 'custom',
        metricValue: 123.456,
        creationDate: 1648661098000
      }
    ])
  })

  it('should use custom context kinds if provided', async () => {
    nock('https://events.launchdarkly.com').post(`/events/bulk/${testSettings.client_id}`).reply(202)

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user1234',
      anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      properties: {
        revenue: 123.456,
        previousId: 'test123'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: testSettings,
      mapping: {
        context_kind: 'segmentUser',
        additional_context_keys: {
          previousId: { '@path': '$.properties.previousId' }
        }
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
    expect(responses[0].options.json).toMatchObject([
      {
        key: 'Test Event',
        contextKeys: { segmentUser: 'user1234', previousId: 'test123' },
        kind: 'custom',
        metricValue: 123.456,
        creationDate: 1648661098000
      }
    ])
  })

  it('should be compatible with an empty additional_context_keys object', async () => {
    nock('https://events.launchdarkly.com').post(`/events/bulk/${testSettings.client_id}`).reply(202)

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user1234',
      anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      properties: {
        revenue: 123.456,
        previousId: 'test123'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: testSettings,
      mapping: {
        context_kind: 'segmentUser',
        additional_context_keys: {}
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
    expect(responses[0].options.json).toMatchObject([
      {
        key: 'Test Event',
        contextKeys: { segmentUser: 'user1234' },
        kind: 'custom',
        metricValue: 123.456,
        creationDate: 1648661098000
      }
    ])
  })

  it('should use anonymousId if userId is missing with default mapping', async () => {
    nock('https://events.launchdarkly.com').post(`/events/bulk/${testSettings.client_id}`).reply(202)

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: undefined,
      anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      properties: {
        revenue: 123.456
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: testSettings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
    expect(responses[0].options.json).toMatchObject([
      {
        key: 'Test Event',
        contextKeys: { user: '72d7bed1-4f42-4f2f-8955-72677340546b' },
        kind: 'custom',
        metricValue: 123.456,
        creationDate: 1648661098000
      }
    ])
  })
})
